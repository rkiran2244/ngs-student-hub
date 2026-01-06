import os
import logging
from typing import BinaryIO

logger = logging.getLogger(__name__)

class Storage:
    def upload(self, fileobj: BinaryIO, key: str, content_type: str = None) -> str:
        raise NotImplementedError

    def url_for(self, key: str, expires_in: int = 3600) -> str:
        raise NotImplementedError


class LocalStorage(Storage):
    def __init__(self, uploads_root: str):
        self.uploads_root = uploads_root

    def upload(self, fileobj: BinaryIO, key: str, content_type: str = None) -> str:
        full_path = os.path.join(self.uploads_root, key)
        dirname = os.path.dirname(full_path)
        os.makedirs(dirname, exist_ok=True)
        # fileobj may be a Werkzeug FileStorage; use save if available
        if hasattr(fileobj, 'save'):
            try:
                fileobj.save(full_path)
            finally:
                # Ensure underlying stream is closed to avoid ResourceWarning
                try:
                    if hasattr(fileobj, 'stream') and hasattr(fileobj.stream, 'close'):
                        fileobj.stream.close()
                except Exception:
                    pass
        else:
            # assume binary stream
            with open(full_path, 'wb') as fh:
                fh.write(fileobj.read())
        # Return the relative key (consistent with previous behaviour)
        return key

    def url_for(self, key: str, expires_in: int = 3600) -> str:
        # Local files are served under /uploads/<relpath> by the app
        return f"/uploads/{key.replace('\\\\', '/')}"


class S3Storage(Storage):
    def __init__(self, bucket: str, region: str = None, endpoint_url: str = None,
                 access_key: str = None, secret_key: str = None, use_path_style: bool = False):
        # Defer boto3 import and client creation until upload to avoid importing heavy
        # dependencies during test collection or when boto3/botocore aren't present.
        client_args = {}
        if access_key and secret_key:
            client_args['aws_access_key_id'] = access_key
            client_args['aws_secret_access_key'] = secret_key
        if region:
            client_args['region_name'] = region
        if endpoint_url:
            client_args['endpoint_url'] = endpoint_url
        if use_path_style:
            client_args['config'] = {'signature_version': 's3v4', 's3': {'addressing_style': 'path'}}

        self._client_args = client_args
        self.s3 = None
        self.bucket = bucket
        self.endpoint_url = endpoint_url
        self.region = region

    def _ensure_client(self):
        if self.s3 is None:
            import boto3
            session = boto3.session.Session()
            # _client_args may include a 'config' dict which boto3 expects as a botocore Config object;
            # transform it if present but keep it optional to avoid importing botocore at module import time.
            client_args = dict(self._client_args)
            if 'config' in client_args:
                try:
                    import botocore.config
                    client_args['config'] = botocore.config.Config(**client_args['config'])
                except Exception:
                    # If botocore isn't available or conversion fails, leave as-is and let boto3 attempt to use it.
                    pass
            self.s3 = session.client('s3', **client_args)

    def upload(self, fileobj: BinaryIO, key: str, content_type: str = None) -> str:
        extra_args = {}
        if content_type:
            extra_args['ContentType'] = content_type
        # fileobj: if it has save, it's a FileStorage; get its stream
        data = None
        if hasattr(fileobj, 'save'):
            # use temporary buffer
            import io
            buf = io.BytesIO()
            try:
                fileobj.save(buf)
                buf.seek(0)
                data = buf
                self._ensure_client()
                self.s3.upload_fileobj(data, self.bucket, key, ExtraArgs=extra_args)
            finally:
                try:
                    buf.close()
                except Exception:
                    pass
        else:
            self._ensure_client()
            self.s3.upload_fileobj(fileobj, self.bucket, key, ExtraArgs=extra_args)
        return self._public_url_for_key(key)

    def _public_url_for_key(self, key: str) -> str:
        # Try to construct a public URL; if endpoint_url is set, use it; otherwise use S3 standard URL
        if self.endpoint_url:
            return f"{self.endpoint_url.rstrip('/')}/{self.bucket}/{key}"
        if self.region:
            return f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{key}"
        return f"https://{self.bucket}.s3.amazonaws.com/{key}"

    def url_for(self, key: str, expires_in: int = 3600) -> str:
        # Generate a presigned GET URL
        try:
            return self.s3.generate_presigned_url('get_object', Params={'Bucket': self.bucket, 'Key': key}, ExpiresIn=expires_in)
        except Exception:
            logger.exception('Failed to generate presigned URL for %s', key)
            return self._public_url_for_key(key)


def get_storage(app_config: dict):
    """Factory to return appropriate storage backend based on config."""
    bucket = os.environ.get('S3_BUCKET') or app_config.get('S3_BUCKET')
    if bucket:
        return S3Storage(
            bucket=bucket,
            region=os.environ.get('S3_REGION') or app_config.get('S3_REGION'),
            endpoint_url=os.environ.get('S3_ENDPOINT_URL') or app_config.get('S3_ENDPOINT_URL'),
            access_key=os.environ.get('S3_ACCESS_KEY_ID') or app_config.get('S3_ACCESS_KEY_ID'),
            secret_key=os.environ.get('S3_SECRET_ACCESS_KEY') or app_config.get('S3_SECRET_ACCESS_KEY'),
            use_path_style=(os.environ.get('S3_PATH_STYLE', '0').lower() in ('1', 'true', 'yes') or app_config.get('S3_PATH_STYLE'))
        )
    # Fallback to local storage
    return LocalStorage(app_config.get('UPLOAD_FOLDER'))

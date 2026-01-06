import io
from backend.models import User, Profile
from backend.utils import hash_password


def register_and_activate(client, db, email='avatar@example.com', password='password', full_name='Avatar User'):
    resp = client.post('/auth/signup', json={'email': email, 'password': password, 'full_name': full_name})
    assert resp.status_code == 200
    # activate profile so login works
    with client.application.app_context():
        profile = Profile.query.filter_by(email=email).first()
        assert profile is not None
        profile.status = 'active'
        db.session.commit()


def login(client, email='avatar@example.com', password='password'):
    resp = client.post('/auth/login', json={'email': email, 'password': password})
    assert resp.status_code == 200
    data = resp.get_json()
    return data['access_token']


def test_upload_and_set_profile_avatar(client, db):
    register_and_activate(client, db)
    token = login(client)
    headers = {'Authorization': f'Bearer {token}'}

    # Create a fake image file
    img_bytes = b"\x89PNG\r\n\x1a\n" + b"0" * 1024
    data = {'file': (io.BytesIO(img_bytes), 'avatar.png')}

    # POST to upload
    resp = client.post('/student/uploads', data=data, headers=headers, content_type='multipart/form-data')
    assert resp.status_code == 200, resp.get_data(as_text=True)
    payload = resp.get_json()
    assert payload.get('success') is True
    upload = payload.get('upload')
    assert upload and upload.get('file_url')
    file_url = upload.get('file_url')

    # Now set avatar on profile
    resp = client.put('/student/profile', json={'avatarUrl': file_url}, headers=headers)
    assert resp.status_code == 200
    assert resp.get_json().get('success') is True

    # Fetch /auth/me and verify avatar_url present
    resp = client.get('/auth/me', headers=headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get('success') is True
    profile = data['user']['profile']
    assert profile.get('avatar_url') == file_url

    # Finally, GET the file URL to make sure the serve_upload route returns the file contents
    get_resp = client.get(file_url)
    assert get_resp.status_code == 200
    # ensure response returns binary png header
    assert get_resp.data.startswith(b"\x89PNG\r\n\x1a\n")

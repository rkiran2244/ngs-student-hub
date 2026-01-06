from backend.models import Profile


def test_signup_stores_course_fields(client, db):
    email = 'course@example.com'
    payload = {
        'email': email,
        'password': 'password',
        'full_name': 'Course User',
        'course_name': 'Computer Science',
        'course_mode': 'online',
        'course_duration': 'long'
    }
    resp = client.post('/auth/signup', json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get('success') is True

    # Verify profile saved
    with client.application.app_context():
        profile = Profile.query.filter_by(email=email).first()
        assert profile is not None
        assert profile.course_name == 'Computer Science'
        assert profile.course_mode == 'online'
        assert profile.course_duration == 'long'

    # Verify /auth/me returns these fields after activating
    with client.application.app_context():
        profile.status = 'active'
        db.session.commit()

    login_resp = client.post('/auth/login', json={'email': email, 'password': 'password'})
    assert login_resp.status_code == 200
    token = login_resp.get_json().get('access_token')

    headers = {'Authorization': f'Bearer {token}'}
    me_resp = client.get('/auth/me', headers=headers)
    assert me_resp.status_code == 200
    me_data = me_resp.get_json()
    assert me_data.get('success') is True
    prof = me_data['user']['profile']
    assert prof['course_name'] == 'Computer Science'
    assert prof['course_mode'] == 'online'
    assert prof['course_duration'] == 'long'
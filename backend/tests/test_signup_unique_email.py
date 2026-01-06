def test_signup_unique_email(client, db):
    # Sign up a user
    resp1 = client.post('/auth/signup', json={'email': 'unique@example.com', 'password': 'password', 'full_name': 'Unique'})
    assert resp1.status_code == 200
    # Attempt duplicate signup
    resp2 = client.post('/auth/signup', json={'email': 'unique@example.com', 'password': 'password', 'full_name': 'Unique2'})
    assert resp2.status_code == 409
    assert resp2.json.get('message') == 'Email already exists'
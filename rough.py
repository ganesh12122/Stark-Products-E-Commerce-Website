from werkzeug.security import generate_password_hash
hashed_password = generate_password_hash('God@123143')
print(hashed_password)
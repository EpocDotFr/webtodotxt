SECRET_KEY = 'secretkeyhere'
ENV = 'production'
USERS = {'username': 'password'}
FORCE_LANGUAGE = None
DEFAULT_LANGUAGE = 'en'
TITLE = None
DISPLAY_CREATION_DATE = True
STORAGE_BACKEND_TO_USE = 'FileSystem'
STORAGE_BACKENDS = {
    'FileSystem': {
        'path': 'storage/data/todo.txt'
    },
    'Dropbox': {
        'access_token': '',
        'path': '/todo.txt'
    }
}

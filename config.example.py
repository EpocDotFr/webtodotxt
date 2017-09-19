SECRET_KEY = 'secretkeyhere'
DEBUG = False
LOGGER_HANDLER_POLICY = 'production'
USERS = {'username': 'password'}
FORCE_LANGUAGE = None
DEFAULT_LANGUAGE = 'en'
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

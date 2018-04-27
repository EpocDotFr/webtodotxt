from os import getenv
from json import loads


def _env(var_name, default):
    val = getenv(var_name)
    if val is not None:
        try:
            val = loads(val)
        except ValueError:
            pass
        return val
    return default


SECRET_KEY = _env('SECRET_KEY', 'this-is-not-a-secret-key!')
DEBUG = False
USERS = _env("USER_DICT", {})
FORCE_LANGUAGE = None
DEFAULT_LANGUAGE = 'en'
TITLE = None
DISPLAY_CREATION_DATE = True
AUTH_BACKEND_TO_USE = _env('AUTH_BACKEND', 'DictAuth')
STORAGE_BACKEND_TO_USE = _env('STORAGE_BACKEND', 'FileSystem')
STORAGE_BACKENDS = {
    'FileSystem': {
        'path': _env("TODO_FILE_PATH", '/data/todo.txt')
    },
    'Dropbox': {
        'access_token': _env("DROPBOX_ACCESS_TOKEN", None),
        'path': _env("TODO_FILE_PATH", '/todo.txt')
    },
    'WebDav': {
        'path': _env("TODO_FILE_PATH", "remote.php/dav/files/{username}/todo/todo.txt"),
        'webdav_hostname': _env("WEBDAV_HOST", "https://my.webdav.com"),
    }
}

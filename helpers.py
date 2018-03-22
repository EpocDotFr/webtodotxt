from webtodotxt import app
import auth_backends
import storage_backends

__all__ = [
    'get_current_storage_backend_instance',
    'get_current_auth_backend'
]


def get_current_storage_backend_instance():
    name = app.config['STORAGE_BACKEND_TO_USE']

    if name not in storage_backends.__all__:
        raise ValueError('{} isn\'t a valid storage backend name'.format(name))

    config = {}

    if name in app.config['STORAGE_BACKENDS']:
        config = app.config['STORAGE_BACKENDS'][name]

    return getattr(storage_backends, name)(config)


def get_current_auth_backend():
    name = app.config['AUTH_BACKEND_TO_USE']

    if name not in auth_backends.__all__:
        raise ValueError('{} isn\'t a valid auth backend name'.format(name))

    return getattr(auth_backends, name)()

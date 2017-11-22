from webtodotxt import app
import storage_backends

__all__ = [
    'get_current_storage_backend_instance'
]


def get_current_storage_backend_instance():
    name = app.config['STORAGE_BACKEND_TO_USE']

    if name not in storage_backends.__all__:
        raise ValueError('{} isn\'t a valid storage backend name'.format(name))

    config = {}

    if name in app.config['STORAGE_BACKENDS']:
        config = app.config['STORAGE_BACKENDS'][name]

    return getattr(storage_backends, name)(config)

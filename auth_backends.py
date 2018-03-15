from webtodotxt import app
from flask import request

try:
    import webdav3.client as wd_client
    from io import BytesIO
except ImportError:
    pass

__all__ = [
    'DictAuth',
    'WebDavAuth'
]


class AuthBackend:
    def retrieve_password(self, username):
        """Get the password for the given user."""
        raise NotImplementedError('Must be implemented')


class DictAuth(AuthBackend):
    def __init__(self, *args, **kwargs):
        super(DictAuth, self).__init__(*args, **kwargs)

    def retrieve_password(self, username):
        if username in app.config['USERS']:
            return app.config['USERS'].get(username)

        return None


class WebDavAuth(AuthBackend):
    def __init__(self, *args, **kwargs):
        super(WebDavAuth, self).__init__(*args, **kwargs)

        if app.config['STORAGE_BACKEND_TO_USE'] != 'WebDav':
            raise ValueError('WebDavAuth can only be used with WebDav storage.')

        self.config = app.config['STORAGE_BACKENDS']['WebDav']

    def retrieve_password(self, username):
        if request.authorization.password is not None:
            client = wd_client.Client(
                {'webdav_hostname': self.config['webdav_hostname'],
                 'webdav_login': username,
                 'webdav_password': request.authorization.password})

            if client.check(self.config['path'].format(username=username)):
                return request.authorization.password

        return None

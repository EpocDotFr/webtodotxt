import todotxtio
from io import BytesIO
from flask import request

# Optional modules/packages
try:
    import dropbox
except ImportError:
    pass
try:
    import webdav3.client as wd_client
except ImportError:
    pass

__all__ = [
    'FileSystem',
    'Dropbox',
    'WebDav'
]


class StorageBackend:
    def __init__(self, config={}):
        self.config = config

    def retrieve(self, user):
        """Get the Todo.txt content."""
        raise NotImplementedError('Must be implemented')

    def store(self, todos, user):
        """Update the Todo.txt content."""
        raise NotImplementedError('Must be implemented')


class FileSystem(StorageBackend):
    def __init__(self, *args, **kwargs):
        super(FileSystem, self).__init__(*args, **kwargs)

    def retrieve(self, user):
        return todotxtio.from_file(self.config['path'])

    def store(self, todos, user):
        todotxtio.to_file(self.config['path'], todos)


class Dropbox(StorageBackend):
    def __init__(self, *args, **kwargs):
        super(Dropbox, self).__init__(*args, **kwargs)

        self.client = dropbox.Dropbox(self.config['access_token'])

    def retrieve(self, user):
        _, response = self.client.files_download(self.config['path'])

        return todotxtio.from_string(response.content.decode('utf-8'))

    def store(self, todos, user):
        data = todotxtio.to_string(todos).encode('utf-8')

        self.client.files_upload(data, self.config['path'], mode=dropbox.files.WriteMode('overwrite'), mute=True)


def _safe_username(username):
    return username.replace("/", "_")


class WebDav(StorageBackend):
    def __init__(self, *args, **kwargs):
        super(WebDav, self).__init__(*args, **kwargs)

    def _make_client(self):
        auth = request.authorization

        hostname = self.config['webdav_hostname']
        username = self.config.get('webdav_login', auth.username)
        password = self.config.get('webdav_password', auth.password)

        options = {'webdav_hostname': hostname,
                   'webdav_login': username,
                   'webdav_password': password}

        return wd_client.Client(options)

    def retrieve(self, username):
        buff = BytesIO()
        res = self._make_client().resource(self.config['path'].format(
            username=_safe_username(username)))
        res.write_to(buff)

        return todotxtio.from_string(buff.getvalue().decode('utf-8'))

    def store(self, todos, username):
        buff = BytesIO(todotxtio.to_string(todos).encode('utf-8'))
        res = self._make_client().resource(self.config['path'].format(
            username=_safe_username(username)))
        res.read_from(buff)

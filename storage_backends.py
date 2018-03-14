import todotxtio

# Optional modules/packages
try:
    import dropbox
except ImportError:
    pass
try:
    import webdav3.client as wd_client
    from io import BytesIO
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

    def retrieve(self):
        """Get the Todo.txt content."""
        raise NotImplementedError('Must be implemented')

    def store(self, todos):
        """Update the Todo.txt content."""
        raise NotImplementedError('Must be implemented')


class FileSystem(StorageBackend):
    def __init__(self, *args, **kwargs):
        super(FileSystem, self).__init__(*args, **kwargs)

    def retrieve(self):
        return todotxtio.from_file(self.config['path'])

    def store(self, todos):
        todotxtio.to_file(self.config['path'], todos)


class Dropbox(StorageBackend):
    def __init__(self, *args, **kwargs):
        super(Dropbox, self).__init__(*args, **kwargs)

        self.client = dropbox.Dropbox(self.config['access_token'])

    def retrieve(self):
        _, response = self.client.files_download(self.config['path'])

        return todotxtio.from_string(response.content.decode('utf-8'))

    def store(self, todos):
        data = todotxtio.to_string(todos).encode('utf-8')

        self.client.files_upload(data, self.config['path'], mode=dropbox.files.WriteMode('overwrite'), mute=True)


class WebDav(StorageBackend):
    def __init__(self, *args, **kwargs):
        super(WebDav, self).__init__(*args, **kwargs)

        options = {'webdav_hostname': self.config['webdav_hostname'],
                   'webdav_login': self.config['webdav_login'],
                   'webdav_password': self.config['webdav_password']}
        self.client = wd_client.Client(options)

    def retrieve(self):
        buff = BytesIO()
        res = self.client.resource(self.config['path'])
        res.write_to(buff)

        return todotxtio.from_string(buff.getvalue().decode('utf-8'))

    def store(self, todos):
        buff = BytesIO(todotxtio.to_string(todos).encode('utf-8'))
        res = self.client.resource(self.config['path'])
        res.read_from(buff)

import todotxtio

# Optional modules/packages
try:
    import dropbox
except ImportError:
    pass


__all__ = [
    'FileSystem',
    'Dropbox'
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

        return todotxtio.from_string(response.text)

    def store(self, todos):
        data = todotxtio.to_string(todos).encode('utf-8')

        self.client.files_upload(data, self.config['path'], mode=dropbox.files.WriteMode('overwrite'), mute=True)

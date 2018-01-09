__all__ = []

# "db_server" is a dictionary that contains authentication information
# for the DB server. It can be an empty dictionary, in which case
# the database named $USER on localhost will be connected to.
# If "password" is "", password is not used in authentication.
# If "password" is "required", password is obtained from $PGPASSWORD
# or user's input.
# If "password" is neither "" nor "required", it is used in authentication.

db_server = {
    "database": "pdr1",
    "host": "localhost",
    "user": "kensaku",
    "password": "required"
}

website_account = {
    "user": "required",
    "password": "required"
}

file_save_root = "./saved_files/"

forced_defaults = {
    "flux": "cmodel_flux",
    "shape": "shape_sdss",
}

unforced_defaults = {
    "flux": "cmodel_flux",
    "shape": "cmodel_ellipse",
}

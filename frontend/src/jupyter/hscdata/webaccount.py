import getpass


def get_website_account():
    """
    Return `config.website_account` with blanks filled in need.
    In the first call to this function, `config.website_account`
    will be overwritten.

    @return {'user': ..., 'password': ...}
    """
    account = config.website_account

    if account.get('user') == "required":
        account["user"] = raw_input('Website user name: ')
    if account.get('password') == "required":
        password = getpass.getpass("Password for '{}'? ".format(account["user"]))
        account['password'] = password

    return account

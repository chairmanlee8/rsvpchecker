import logging
from sqlalchemy import Integer, BigInteger

configDict = dict()

class ConfigMeta(type):
    # MetaClass to automatically register new config's. So All you have to do
    # is inherit from DefaultConfig and it will be available to you
    # in command line option.
    def __new__(meta, name, bases, dct):
        newClass = super(ConfigMeta, meta).__new__(meta, name, bases, dct)
        configDict[name.lower().replace("config", "")] = newClass
        return newClass
        
class DefaultConfig(object, metaclass=ConfigMeta):
    debug = False
    sql_debug = False
    fb_api_key = '441492242600176'
    fb_secret = '6be3b0edc846c26c121ab112f3236c50'
    cookie_secret = 'nM0NVc7gCITOiP+ueLNTE+fl/CwiR5JCBZzve9ChSe0='

    site_url = 'localhost:8080'     # DONT PUT http://
    login_url = '/'   
    
    address = "0.0.0.0"
    domain = ".mystudycloud.com"
    sqlURI = "mysql://realtimespaces:realtimespaces@localhost:3306/realtimespaces"
    primaryKeyField = BigInteger
    default_limit = 50              # Default limit for GET requests on collections with limit option.
    default_edit_distance = 5       # Default threshold for Levenhstein distance comparisons.
    default_client_expire = 300     # For socket clients
    logging_mask = logging.INFO
    admins = [
        100002434585264,   # Andrew Lee
    ]
    server_timezone = "UTC"
    server_adv_timezone = "GMT"

class DevPureConfig(DefaultConfig):
    """ Config to use sqllite3 instead of MySQL. For the poor folks without MySQL. """
    debug = True
    sql_debug = False
    sqlURI = 'sqlite:///test.db'
    primaryKeyField = Integer

class DevPurestConfig(DefaultConfig):
    """ Uses sqllite3 in memory mode, useful for mucking around in shell. """
    debug = True
    sql_debug = False
    sqlURI = 'sqlite:///:memory:'
    primaryKeyField = Integer

class DevUnitTest(DefaultConfig):
    """ Configuration for running unit tests. """
    debug = False               # Suppress any output not related to unit tests.
    sql_debug = False
    logging_mask = logging.CRITICAL
    sqlURI = 'sqlite:///:memory:'
    primaryKeyField = Integer
    default_limit = 50          # Warning: changing test default_* values may break unit tests
    default_edit_distance = 5

class AndrewConfig(DefaultConfig):
    """ Andrew's MacBook Pro """
    debug = True
    sql_debug = False
    sqlURI = 'mysql://studycloud:pass@127.0.0.1:3306/studycloud?charset=utf8'
    server_timezone = "CDT"
    server_adv_timezone = "US/Central"

class ProductionConfig(DefaultConfig):
    """ Production configuration that runs on the production server """
    debug = True
    fb_api_key = '548946371797639'
    fb_secret = '8e319411ef77ac03608af70c58a0dc27'
    sqlURI = 'sqlite:///:memory:'
    site_url = 'www.mystudycloud.com'
    bypass_haml_sass = True

class ObjectProxy(object):
    #A proxy object to obscure the module wide variable usage.
    def __init__(self, obj):
        self.currentObj = obj
    
    def setObj(self, obj):
        self.currentObj = obj
        
    def __getattr__(self, name):
        return getattr(self.currentObj, name)
        
currentConfig = ObjectProxy(DefaultConfig)

def setConfig(configName):
    currentConfig.setObj(configDict.get(configName, DefaultConfig))

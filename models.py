import hashlib, imp

from sqlalchemy import create_engine, select, Sequence, Table, Column, ForeignKey, DateTime, Enum, Boolean, Integer, BigInteger, String, Text
from sqlalchemy.orm import relationship, backref, scoped_session, sessionmaker
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import Comparator, hybrid_property, hybrid_method
from sqlalchemy.sql import text
from sqlalchemy.sql.expression import func

from tornado.escape import json_encode, json_decode

from configuration import currentConfig

Base = declarative_base()

# TODO: this is terrible system nuke it later when time permits
class JSONSerializable:
    def json(self):
        raise NotImplementedError
        
class Backend(object):
    def __init__(self):
        self._engine = create_engine(currentConfig.sqlURI, echo=currentConfig.sql_debug, pool_recycle=3600)
        self._session = scoped_session(sessionmaker(bind=self._engine))

    @classmethod
    def instance(cls):
        if not hasattr(cls, "_instance"):
            cls._instance = cls()
        return cls._instance

    def get_session(self):
        return self._session
        
    def get_engine(self):
        return self._engine

class HashComparator(Comparator):
    def operate(self, op, other):
        return op(self.__clause_element__(), sha.new(other).hexdigest())

#####################
### "Main" models ###
#####################

class User(Base):
    __tablename__ = 'user'

    id = Column(currentConfig.primaryKeyField, primary_key=True, nullable=False, autoincrement=True)
    email = Column(String(128), unique=True, nullable=True)
    facebook_id = Column(BigInteger, unique=True, nullable=True)
    name = Column(String(128))
    _password = Column(String(40), nullable=True)
    join_time = Column(DateTime, default=func.now())

    @hybrid_property
    def firstname(self):
        try:
            return self.name.split()[0]
        except IndexError:
            return ""
        except AttributeError:
            return self.name

    @hybrid_property
    def is_admin(self):
        return (self.email in currentConfig.admins) or (self.facebook_id in currentConfig.admins)

    @is_admin.setter
    def is_admin(self, value):
        raise AttributeError("Attribute is read-only.")

    # TODO: allow this to be used as kw in __init__
    @hybrid_property
    def password(self):
        return self._password

    @password.setter
    def password(self, value):
        self._password = hashlib.sha1(value).hexdigest()

    @password.comparator
    def password(cls):
        return HashComparator(cls._password)

    def json(self):
        return {
            'id': self.id,
            'email': self.email,
            'facebook_id': self.facebook_id,
            'name': self.name,
            'join_time': str(self.join_time),
        }

metadata = Base.metadata
def create_all():    
    engine = Backend.instance().get_engine()
    metadata.create_all(engine)
    session = Backend.instance().get_session()

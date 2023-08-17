from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DateTime, Binary
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'user'
    
    user_id = Column(Integer, primary_key=True, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    username = Column(String, unique=True)
    password = Column(String)  # Stored as a hash in production
    affiliation = Column(String)
    account_type = Column(String)
    
    sessions = relationship('ChatSession', back_populates='user')
    pictures = relationship('UserPicture', back_populates='user')

class ChatSession(Base):
    __tablename__ = 'chat_session'
    
    session_id = Column(Integer, primary_key=True, nullable= False)
    user_id = Column(Integer, ForeignKey('user.user_id'))
    start_timestamp = Column(DateTime, default=datetime.utcnow)
    end_timestamp = Column(DateTime, nullable=True)
    
    user = relationship('User', back_populates='sessions')
    messages = relationship('Message', back_populates='session')

class Message(Base):
    __tablename__ = 'message'
    
    message_id = Column(Integer, primary_key=True, nullable= False, nullable= False)
    session_id = Column(Integer, ForeignKey('chat_session.session_id'))
    content = Column(String)
    is_bot = Column(Boolean)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    session = relationship('ChatSession', back_populates='messages')

class UserPicture(Base):
    __tablename__ = 'user_picture'
    
    picture_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.user_id'))
    picture_data = Column(Binary)
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship('User', back_populates='pictures')

# Replace 'sqlite:///your_database.db' with your actual database connection string
engine = create_engine('sqlite:///your_database.db')
Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)
session = Session()

# Example of adding a user to the database
new_user = User(
    first_name='John',
    last_name='Doe',
    username='johndoe',
    password='hashed_password',
    affiliation='Example University',
    account_type='Standard'
)
session.add(new_user)
session.commit()

# You can similarly add data to other tables (ChatSession, Message, UserPicture)

from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DateTime
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
    

class ChatSession(Base):
    __tablename__ = 'chat_session'
    
    session_id = Column(Integer, primary_key=True, nullable= False)
    user_id = Column(Integer, ForeignKey('user.user_id', ondelete='SET NULL'), nullable=False)
    start_timestamp = Column(DateTime, default=datetime.utcnow)
    end_timestamp = Column(DateTime, nullable=True)
    
    user = relationship('User', back_populates='sessions')
    messages = relationship('Message', back_populates='session')

class Message(Base):
    __tablename__ = 'message'
    
    message_id = Column(Integer, primary_key=True, nullable= False)
    session_id = Column(Integer, ForeignKey('chat_session.session_id', ondelete='SET NULL'), nullable=False)
    content = Column(String)
    is_bot = Column(Boolean)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    session = relationship('ChatSession', back_populates='messages')
    pictures = relationship('UserPicture', back_populates='message')
    # Remove the 'pictures' relationship here

class UserPicture(Base):
    __tablename__ = 'user_picture'
    
    picture_id = Column(Integer, primary_key=True)
    picture_data = Column(String)
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    
    message_id = Column(Integer, ForeignKey('message.message_id', ondelete='SET NULL'), nullable=False)  # Foreign key to Message model
    message = relationship('Message', back_populates='pictures')

SQLALCHEMY_DATABASE_URL = 'postgresql://postgres:muhammad@localhost:5432/chatgpt-clone'

engine = create_engine(SQLALCHEMY_DATABASE_URL)
Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)
session = Session()

# Example of adding a user to the database
new_user = User(
    first_name='Ishaque',
    last_name='Nizamai',
    username='Nizamani123',
    password='hashed_password',
    affiliation='Quantum leap',
    account_type='Standard'
)
session.add(new_user)
session.commit()

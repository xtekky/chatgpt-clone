// eslint-disable-next-line no-unused-vars
class ChatGPTClone {
  constructor(conversationId) {
    this.conversationId = conversationId
    window.addEventListener('DOMContentLoaded', () => {
      this.onDOMReady()
    })
  }

  onDOMReady() {
    this.abortController = new AbortController()
    this.markdown = window.markdownit()
    this.messageBox = document.querySelector('#messages')
    this.messageInput = document.querySelector('#message-input')
    this.boxConversations = document.querySelector('.top')
    this.spinner = document.querySelector('.spinner')
    this.sidebar = document.querySelector('.conversations')
    this.stopGenerating = document.querySelector('.stop_generating')
    this.sendButton = document.querySelector('#send-button')
    this.messageInputLocked = false
    this.userAvatar = `<img src="${window.STATIC_BASE_URL}images/user.png" alt="User Avatar">`
    this.gptAvatar = `<img src="${window.STATIC_BASE_URL}images/gpt.png" alt="GPT Avatar">`

    if (!window.location.href.endsWith('#')) {
      if (/\/chat\/.+/.test(window.location.href)) {
        this.loadConversation(this.conversationId)
      }
    }

    document.querySelector('#delete-conversations-button').addEventListener('click', () => {
      this.deleteAllConversations()
    })

    this.sidebar.addEventListener('click', event => {
      this.conversationButtonsClick(event)
    })

    document.querySelector('#cancel-button').addEventListener('click', () => {
      this.requestCompleted()
    })

    this.messageInput.addEventListener('keydown', event => {
      if (this.messageInputLocked || event.shiftKey || event.key !== 'Enter') {
        return
      }

      event.preventDefault()
      this.messageHandler()
    })

    this.sendButton.addEventListener('click', () => {
      if (this.messageInputLocked) {
        return
      }
      this.messageHandler()
    })

    document.querySelector('.mobile-sidebar').addEventListener('click', event => {
      this.mobileSidebarClick(event)
    })

    this.loadConversations(20, 0)

    this.messageInput.focus()

    hljs.addPlugin(new CopyButtonPlugin())
  }

  async messageHandler() {
    const message = this.messageInput.value
    if (message.length > 0) {
      this.messageInput.value = ''
      this.request(message)
    }
  }

  async request(message) {
    const responseId = this.uuidv4()
    this.messageInputLocked = true

    this.stopGenerating.classList.remove('stop_generating-hidden')

    this.messageBox.innerHTML += `
              <div class="message">
                  <div class="user">
                      ${this.userAvatar}
                      <i class="fa-regular fa-phone-arrow-up-right"></i>
                  </div>
                  <div class="content">
                      ${this.markdown.render(message)}
                  </div>
              </div>
          `
    this.messageBox.scrollTop = this.messageBox.scrollHeight

    this.messageBox.innerHTML += `
              <div class="message">
                  <div class="user">
                      ${this.gptAvatar} <i class="fa-regular fa-phone-arrow-down-left"></i>
                  </div>
                  <div class="content" id="gpt-content-${responseId}">
                      <div id="cursor"></div>
                  </div>
              </div>
          `
    this.messageBox.scrollTop = this.messageBox.scrollHeight
    const gptContent = document.querySelector(`#gpt-content-${responseId}`)

    const errorHandler = errorMessage => {
      const cursorDiv = document.querySelector('#cursor')
      if (cursorDiv) {
        cursorDiv.parentNode.removeChild(cursorDiv)
      }

      gptContent.innerHTML = errorMessage
      this.requestCompleted()
    }

    const conversation = this.getConversation(this.conversationId)
    let responseText = ''

    try {
      this.abortController = new AbortController()
      const response = await fetch('/chat/', {
        method: 'POST',
        signal: this.abortController.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': Cookies.get('csrftoken'),
        },
        body: JSON.stringify({
          conversationId: this.conversationId,
          meta: {
            content: {
              conversation: conversation ? conversation.items : [],
              web_access: document.querySelector('#web-access').checked,
              content_type: 'text',
              parts: [
                {
                  content: message,
                  role: 'user',
                },
              ],
            },
          },
        }),
      })

      if (response.ok) {
        if (!conversation) {
          this.addConversation(message)
        }
        this.addMessageToConversation('user', message)
        const reader = response.body.getReader()

        while (reader) {
          // eslint-disable-next-line no-await-in-loop
          const { done, value } = await reader.read()
          responseText += new TextDecoder('utf-8').decode(value)
          gptContent.innerHTML = this.markdown.render(responseText)
          gptContent.querySelectorAll('code').forEach(el => hljs.highlightElement(el))
          this.messageBox.scrollTo({ top: this.messageBox.scrollHeight, behavior: 'auto' })
          if (done) {
            this.addMessageToConversation('assistant', responseText)
            break
          }
        }
      } else {
        const errorResponse = await response.text()
        errorHandler(errorResponse)
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.addMessageToConversation('assistant', responseText)
        return
      }

      this.deleteConversation(this.conversationId)
      errorHandler('Sorry, something went wrong. Please try again later.')
      console.log('fetch error: ', error)
    }
    this.requestCompleted()
  }

  requestCompleted() {
    this.loadConversations(20, 0)
    this.removeCancelButton()
    this.messageInputLocked = false
  }

  newConversation() {
    window.history.pushState({}, null, '/chat/')
    this.conversationId = this.uuidv4()

    this.clearConversation()
    this.loadConversations(20, 0, true)
  }

  loadConversation(conversationId) {
    const conversation = this.getConversation(conversationId)
    if (!conversation) {
      return
    }

    conversation.items.forEach(item => {
      this.messageBox.innerHTML += `
                    <div class="message">
                        <div class="user">
                            ${item.role === 'assistant' ? this.gptAvatar : this.userAvatar}
                            ${
                              item.role === 'assistant'
                                ? '<i class="fa-regular fa-phone-arrow-down-left"></i>'
                                : '<i class="fa-regular fa-phone-arrow-up-right"></i>'
                            }
                        </div>
                        <div class="content">
                            ${item.role === 'assistant' ? this.markdown.render(item.content) : item.content}
                        </div>
                    </div>
                `
    })

    hljs.highlightAll()

    this.messageBox.scrollTo({
      top: this.messageBox.scrollHeight,
      behavior: 'smooth',
    })

    setTimeout(() => {
      this.messageBox.scrollTop = this.messageBox.scrollHeight
    }, 500)
  }

  loadConversations() {
    const conversations = []
    for (let i = 0; i < window.localStorage.length; i += 1) {
      if (localStorage.key(i).startsWith('conversation:')) {
        const conversation = window.localStorage.getItem(localStorage.key(i))
        conversations.push(JSON.parse(conversation))
      }
    }

    this.clearConversations()

    conversations.forEach(conversation => {
      this.boxConversations.innerHTML += `
          <div class="convo" id="convo-${conversation.id}">
            <div class="set-conversation-button left" data-conversation-id="${conversation.id}">
                <i class="fa-regular fa-comments"></i>
                <span class="convo-title">${conversation.title}</span>
            </div>
            <i class="show-option-button fa-regular fa-trash" id="conv-${conversation.id}" data-conversation-id="${conversation.id}"></i>
            <i class="delete-conversation-button fa-regular fa-check" id="yes-${conversation.id}" data-conversation-id="${conversation.id}" style="display:none;"></i>
            <i class="hide-option-button fa-regular fa-x" id="not-${conversation.id}" data-conversation-id="${conversation.id}" style="display:none;"></i>
          </div>
          `
    })

    hljs.highlightAll()
  }

  getConversation() {
    return JSON.parse(window.localStorage.getItem(`conversation:${this.conversationId}`))
  }

  setConversation(conversationId) {
    window.history.pushState({}, null, `/chat/${conversationId}`)
    this.conversationId = conversationId

    this.clearConversation()
    this.loadConversation(conversationId)
    this.loadConversations(20, 0, true)
  }

  addConversation(title) {
    if (localStorage.getItem(`conversation:${this.conversationId}`) === null) {
      window.localStorage.setItem(
        `conversation:${this.conversationId}`,
        JSON.stringify({
          id: this.conversationId,
          title,
          items: [],
        })
      )
    }
  }

  clearConversation() {
    const messages = this.messageBox.getElementsByTagName('div')

    while (messages.length > 0) {
      this.messageBox.removeChild(messages[0])
    }
  }

  clearConversations() {
    const elements = this.boxConversations.childNodes

    elements.forEach(element => {
      if (element.nodeType === Node.ELEMENT_NODE && element.tagName.toLowerCase() !== 'button') {
        this.boxConversations.removeChild(element)
      }
    })
  }

  deleteConversation(conversationId) {
    window.localStorage.removeItem(`conversation:${conversationId}`)

    const conversation = document.querySelector(`#convo-${conversationId}`)
    conversation.remove()

    if (this.conversationId === conversationId) {
      this.newConversation()
    }

    this.loadConversations(20, 0, true)
  }

  deleteAllConversations() {
    window.localStorage.clear()
    this.newConversation()
  }

  // eslint-disable-next-line class-methods-use-this
  showConversationOptions(conversationId) {
    document.querySelector(`#conv-${conversationId}`).style.display = 'none'
    document.querySelector(`#yes-${conversationId}`).style.display = 'block'
    document.querySelector(`#not-${conversationId}`).style.display = 'block'
  }

  // eslint-disable-next-line class-methods-use-this
  hideConversationOptions(conversationId) {
    document.querySelector(`#conv-${conversationId}`).style.display = 'block'
    document.querySelector(`#yes-${conversationId}`).style.display = 'none'
    document.querySelector(`#not-${conversationId}`).style.display = 'none'
  }

  addMessageToConversation(role, content) {
    const conversation = this.getConversation(this.conversationId)

    if (!conversation) {
      return
    }

    conversation.items.push({
      role,
      content,
    })

    window.localStorage.setItem(`conversation:${this.conversationId}`, JSON.stringify(conversation))
  }

  conversationButtonsClick(event) {
    const button = event.target.closest('button')
    if (button && button.classList.contains('new-conversation') && !this.messageInputLocked) {
      this.newConversation()
      return
    }

    const divButton = event.target.closest('div')
    if (divButton && divButton.classList.contains('set-conversation-button')) {
      const conversationId = divButton.getAttribute('data-conversation-id')
      this.setConversation(conversationId)
      return
    }

    const iButton = event.target.closest('i')
    if (iButton) {
      if (iButton.classList.contains('show-option-button')) {
        this.showConversationOptions(iButton.getAttribute('data-conversation-id'))
      }

      if (iButton.classList.contains('delete-conversation-button')) {
        this.deleteConversation(iButton.getAttribute('data-conversation-id'))
      }

      if (iButton.classList.contains('hide-option-button')) {
        this.hideConversationOptions(iButton.getAttribute('data-conversation-id'))
      }
    }
  }

  removeCancelButton() {
    this.abortController.abort()
    this.stopGenerating.classList.add('stop_generating-hiding')

    setTimeout(() => {
      this.stopGenerating.classList.remove('stop_generating-hiding')
      this.stopGenerating.classList.add('stop_generating-hidden')
    }, 300)
  }

  mobileSidebarClick(event) {
    if (this.sidebar.classList.contains('shown')) {
      this.sidebar.classList.remove('shown')
      event.target.classList.remove('rotated')
    } else {
      this.sidebar.classList.add('shown')
      event.target.classList.add('rotated')
    }

    window.scrollTo(0, 0)
  }

  async typeText(text, element) {
    let typedText = ''
    const chunkSize = 5
    const typingSpeed = 30
    for (let i = 0; i < text.length; i += chunkSize) {
      typedText += text.substring(i, i + chunkSize)
      // eslint-disable-next-line no-param-reassign
      element.innerHTML = this.markdown.render(typedText)
      element.querySelectorAll('code').forEach(el => hljs.highlightElement(el))
      this.messageBox.scrollTo({ top: this.messageBox.scrollHeight, behavior: 'auto' })
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, typingSpeed))
    }
  }

  // eslint-disable-next-line class-methods-use-this
  uuidv4() {
    // eslint-disable-next-line space-infix-ops, no-bitwise, implicit-arrow-linebreak
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    )
  }
}

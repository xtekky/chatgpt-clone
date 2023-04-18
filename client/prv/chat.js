const query             = (obj) => Object.keys(obj).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k])).join('&');
const markdown          = window.markdownit();
const message_box       = document.getElementById(`messages`);
const message_input     = document.getElementById(`message-input`);
const box_conversations = document.querySelector(`.top`)
const spinner           = box_conversations.querySelector('.spinner');
const stop_generating   = document.querySelector(`.stop_generating`);
const send_button       = document.querySelector(`#send-button`);
let   prompt_lock       = false

const delete_conversations = async () => {
    localStorage.clear()
    await new_conversation()
}

const handle_ask = async () => {
    let message = message_input.value;

    if (message.length > 0) {
        message_input.value = ``;
        await ask_gpt(message);
    }
}

const remove_cancel_button = async () => {
    stop_generating.classList.add(`stop_generating-hiding`);

    setTimeout(() => {
        stop_generating.classList.remove(`stop_generating-hiding`);
        stop_generating.classList.add(`stop_generating-hidden`);
    }, 300);
}

const ask_gpt = async (message) => {
    try {
        add_conversation(window.conversation_id, message.substr(0, 20))

        window.controller = new AbortController();

        model        = document.getElementById("model")
        prompt_lock  = true
        window.text   = ``;
        window.token = message_id()

        stop_generating.classList.remove(`stop_generating-hidden`);
    
        message_box.innerHTML += `
            <div class="message">
                <div class="user">
                    ${user_image}
                    <i class="fa-regular fa-phone-arrow-up-right"></i>
                </div>
                <div class="content" id="user_${token}"> 
                    ${message}
                </div>
            </div>
        `;
        message_box.scrollTop = message_box.scrollHeight
        await new Promise(r => setTimeout(r, 500));

        message_box.innerHTML += `
            <div class="message">
                <div class="user">
                    ${gpt_image} <i class="fa-regular fa-phone-arrow-down-left"></i>
                </div>
                <div class="content" id="gpt_${window.token}">
                    <div id="cursor"></div>
                </div>
            </div>
        `;
    
        message_box.scrollTop = message_box.scrollHeight
        await new Promise(r => setTimeout(r, 1000));

        const response = await fetch(`/backend-api/v2/conversation`, { method: `POST`, signal: window.controller.signal,
            headers: {
                    'content-type' : `application/json`,
                    accept         : `text/event-stream`
            },
            body: JSON.stringify({
                conversation_id : window.conversation_id,
                action          : `_ask`,
                model           : model.options[model.selectedIndex].value,
                meta        : {
                    id   : window.token,
                    content : {
                        conversation    : await get_conversation(window.conversation_id),
                        internet_access : document.getElementById("switch").checked,
                        content_type    : "text",
                        parts           : [{
                            content: message,
                            role   : "user"
                        }]
                    }
                }
            })
        })
    
        const reader = response.body.getReader();

        while (true) {
            const { value, done } = await reader.read(); if (done) break;

            const chunk           = new TextDecoder().decode(value);
            const objects         = chunk.match(/({.+?})/g);

            
            try { if (JSON.parse(objects[0]).success === false) throw new Error(JSON.parse(objects[0]).error) } catch (e) {}
            
            objects.forEach((object) => {
                console.log(object)
                try { text += h2a(JSON.parse(object).content) } catch(t) { console.log(t); throw new Error(t)}
            });
            
            document.getElementById(`gpt_${window.token}`).innerHTML = markdown.render(text)
            document.querySelectorAll(`code`).forEach((el) => {
                hljs.highlightElement(el);
            });
    
            message_box.scrollTo({ top: message_box.scrollHeight, behavior: 'auto' })
        }

        add_message(window.conversation_id, 'user', message)
        add_message(window.conversation_id, 'assistant', text)
        
        message_box.scrollTop = message_box.scrollHeight
        await remove_cancel_button()
        prompt_lock = false

        await load_conversations(20, 0)

    } catch (e) {
        add_message(window.conversation_id, 'user', message)
        
        message_box.scrollTop = message_box.scrollHeight
        await remove_cancel_button()
        prompt_lock = false

        await load_conversations(20, 0)

        console.log(e)

        let cursorDiv = document.getElementById(`cursor`);
        if (cursorDiv) cursorDiv.parentNode.removeChild(cursorDiv)

        if (e.name != `AbortError`) {
            let error_message = `oops ! something went wrong, please try again / reload. [stacktrace in console]`

            document.getElementById(`gpt_${window.token}`).innerHTML = error_message
            add_message(window.conversation_id, 'assistant', error_message)
        } else {
            document.getElementById(`gpt_${window.token}`).innerHTML += ` [aborted]`
            add_message(window.conversation_id, 'assistant', text + ` [aborted]`)
        }

    }
}

const clear_conversations = async () => {
    const elements = box_conversations.childNodes;
    let   index    = elements.length;

    if (index > 0 ) {
        while (index--) {
            const element = elements[index];
            if (element.nodeType === Node.ELEMENT_NODE && element.tagName.toLowerCase() !== `button`) {
                box_conversations.removeChild(element);
            }
        }
    }
}

const clear_conversation = async () => {
    let messages     = message_box.getElementsByTagName(`div`);

    while(messages.length > 0) {
        message_box.removeChild(messages[0]);
    }
}

const delete_conversation = async (conversation_id) => {
    localStorage.removeItem(`${conversation_id}`)
    
    if (window.conversation_id == conversation_id) {
        await new_conversation()
    }

    await load_conversations(20, 0, true)
}

const set_conversation = async (conversation_id) => {
    history.pushState({}, null, `/chat/${conversation_id}`);
    window.conversation_id = conversation_id

    await clear_conversation()
    await load_conversation(conversation_id)
    await load_conversations(20, 0, true)
}

const new_conversation = async () => {
    history.pushState({}, null, `/chat/`);
    window.conversation_id = uuid()

    await clear_conversation()
    await load_conversations(20, 0, true)
}

const load_conversation = async (conversation_id) => {
    let conversation    = await JSON.parse(localStorage.getItem(conversation_id))

    for (item of conversation.items) {
        message_box.innerHTML += `
            <div class="message">
                <div class="user">
                    ${item.role == "assistant" ? gpt_image : user_image}
                    ${item.role == "assistant"
                        ? `<i class="fa-regular fa-phone-arrow-down-left"></i>`
                        : `<i class="fa-regular fa-phone-arrow-up-right"></i>`}
                </div>
                <div class="content">
                    <p>${markdown.render(item.content)}</p>
                </div>
            </div>
        `;
    }

    document.querySelectorAll(`code`).forEach((el) => {
        hljs.highlightElement(el);
    });

    message_box.scrollTo({ top: message_box.scrollHeight, behavior: 'smooth' })

    setTimeout(() => {
        message_box.scrollTop = message_box.scrollHeight
    }, 500);
}

const get_conversation = async (conversation_id) => {
    let conversation    = await JSON.parse(localStorage.getItem(conversation_id))
    return conversation.items
}

const add_conversation = async (conversation_id, title) => {
    if (localStorage.getItem(conversation_id) == null) {
        localStorage.setItem(conversation_id, JSON.stringify({
            id    : conversation_id,
            title : title,
            items : []
        }))
    }
}

const add_message = async (conversation_id, role, content) => {
    before_adding = JSON.parse(localStorage.getItem(conversation_id))

    before_adding.items.push({ 
        role    : role,
        content : content
    })

    localStorage.setItem(conversation_id, JSON.stringify(before_adding)) // update conversation
}

const load_conversations = async (limit, offset, loader) => {
    //console.log(loader);
    //if (loader === undefined) box_conversations.appendChild(spinner);

    let conversations = [];
    for (let i = 0; i < localStorage.length; i++) {
        let conversation = localStorage.getItem(localStorage.key(i))
        conversations.push(JSON.parse(conversation))
    }
    
    //if (loader === undefined) spinner.parentNode.removeChild(spinner)
    await clear_conversations()

    for (conversation of conversations) {
        box_conversations.innerHTML += `
            <div class="convo">
                <div class="left" onclick="set_conversation('${conversation.id}')">
                    <i class="fa-regular fa-comments"></i>
                    <span class="convo-title">${conversation.title}</span>
                </div>
                <i onclick="delete_conversation('${conversation.id}')" class="fa-regular fa-trash"></i>
            </div>
        `;
    }

    document.querySelectorAll(`code`).forEach((el) => {
        hljs.highlightElement(el);
    });
}

document.getElementById(`cancelButton`).addEventListener(`click`, async () => {
    window.controller.abort();
    console.log(`aborted ${window.conversation_id}`);
})

function h2a(str1) {
	var hex  = str1.toString();
	var str = '';

	for (var n = 0; n < hex.length; n += 2) {
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	}

	return str;
}

const uuid = () => {
    return `xxxxxxxx-xxxx-4xxx-yxxx-${Date.now().toString(16)}`.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

const message_id = () => {
    random_bytes = (Math.floor(Math.random() * 1338377565) + 2956589730).toString(2)
    unix         = Math.floor(Date.now() / 1000).toString(2)

    return BigInt(`0b${unix}${random_bytes}`).toString()
}

const auth = async () => {
    try {
        let auth_req = await fetch(`/backend-api/v1/auth`, {headers: {}})
        let auth     = await auth_req.json()} 
    
    catch (e) { 
        console.log(e) }
}

window.onload = async () => {
    // await setTimeout(() => {
    //     auth()
    // }, 1);
    
    await setTimeout(() => {
        load_conversations(20, 0)
    }, 1);

    if (/\/chat\/.+/.test(window.location.href)) {
        await load_conversation(window.conversation_id)
    }

    message_input.addEventListener(`keydown`, async (event) => {
        if (prompt_lock) return;
        const e = event.key || event.code;
    
        if (e === `Enter`) {
            console.log('pressed enter');
            await handle_ask();
        }
    });
    
    send_button.addEventListener(`click`, async () => {
        console.log('clicked send');
        if (prompt_lock) return;
        await handle_ask();
    });
};
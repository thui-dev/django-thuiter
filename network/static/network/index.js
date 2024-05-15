//sets default light theme 
if (!localStorage.getItem('theme')){
    localStorage.setItem('theme', 'light');
} 
document.querySelector('html').setAttribute('data-bs-theme', localStorage.getItem('theme'));

document.addEventListener('DOMContentLoaded', () => {
    //ajeitando pathname to be passed in as variable
    let pathname = window.location.pathname.split('/')

    //load user profile, post or feed_all
    if (pathname[1] == 'post'){
        post_view(pathname[2]);
    }else if (pathname[1] == ''){
        load_feed('all', 'feed');
    }/*else if(pathname[1] == 'chats'){
        chats_view();
    }*/else{
        load_profile(pathname[1]);
    }
    //messages_view();
    //load_feed('all', 'feed');

    //theme toggle button
    let mode_toggle = document.querySelector('#mode-toggle');
    if (localStorage.getItem('theme') == 'light'){
        mode_toggle.innerHTML = '<i class="bi bi-moon"></i>';
    }else{
        mode_toggle.innerHTML = '<i class="bi bi-sun"></i>';
    }
    mode_toggle.addEventListener('click', () => {
        if (localStorage.getItem('theme') == "light"){
            mode_toggle.innerHTML = '<i class="bi bi-sun"></i>';
            document.querySelector('html').setAttribute('data-bs-theme','dark');
            localStorage.setItem('theme', 'dark');
        }else{
            mode_toggle.innerHTML = '<i class="bi bi-moon"></i>';
            document.querySelector('html').setAttribute('data-bs-theme','light');
            localStorage.setItem('theme', 'light');
        }
    });

    //bottom navbar, if logged in
    document.querySelector('#logo').addEventListener('click', () => load_feed('all', 'feed'));
    try{
        //document.querySelector('#chat_view').addEventListener('click', () => chat_view());
        document.querySelector('#create').addEventListener('click', () => create());
        document.querySelector('#following').addEventListener('click', () => load_feed('all', 'feed'));
        document.querySelector('#chat_button').addEventListener('click', ()=>chats_view())
        document.querySelector('#user-profile').addEventListener('click', () => {
            load_profile(document.querySelector('#user-profile').dataset.username)
        });
        logged=true;
    }catch{
        logged = false;
    }

    current_user_username = document.querySelector('#current_user_username').innerHTML;

    //feed view navbar(all/following)
    document.querySelector("#recentes_header").addEventListener('click', ()=>{load_feed('all', 'feed')});
    document.querySelector("#seguindo_header").addEventListener('click', ()=>{load_feed('following', 'feed')});
});

function messages_view(chat){
    hide_all_but_this_view('messages_view');
    
    document.querySelector('#messages_back_to_chats').addEventListener('click', ()=>{
        hide_all_but_this_view('chats_view');
    })
    //history.pushState({section: ''}, '', 'messages');
    
    document.querySelector('#messages_view_body').innerHTML='';
    
    document.querySelector('#message_header_pfp').innerHTML=`<img src="${chat.user_pfp_url}" class="img-fluid" style="border-radius:100%; aspect-ratio: 1 / 1; object-fit: cover; max-height:35px">`;
    document.querySelector('#message_header_username').innerHTML=chat.username;

    //send message, and appear on screen client side
    document.querySelector('#new_message_submit').addEventListener('click', ()=>{
        message_content = document.querySelector('#new_message_content').value;
        if(message_content != ''){
            fetch(`/api/new_message/`, {
                method: 'POST',
                headers: {'X-CSRFToken':document.querySelector('[name=csrfmiddlewaretoken]').value},
                body: JSON.stringify({
                    receiver:chat.username,
                    content:message_content,
                })
            });
            const message_element = document.createElement('div');
            message_element.innerHTML = `
            <div style="height:8px"></div>
            <div class="row justify-content-end">
                <div class="col-auto">
                    <div class="d-inline-flex p-2 text-break" style="background-color:rgba(89, 89, 89, 0.3); border-radius:10px">
                        ${message_content}
                    </div>
                </div>
            </div>
            `;
            document.querySelector('#messages_view_body').append(message_element);
    
            document.querySelector('#new_message_content').value = '';
            scrollTo(0, document.body.scrollHeight)
        }
    });

    //get messages
    fetch(`messages/${chat.username}`)
    .then(response => response.json())
    .then(messages => {
        messages.forEach(message => {
            const message_element = document.createElement('div');
            
            if(current_user_username == message.sender){
                message_element.innerHTML = `
                <div style="height:8px"></div>
                <div class="row justify-content-end">
                    <div class="col-auto">
                        <div class="d-inline-flex p-2 text-break" style="background-color:rgba(89, 89, 89, 0.3); border-radius:10px">
                            ${message.content}
                        </div>
                    </div>
                </div>
                `;
            }else{
                message_element.innerHTML = `
                <div style="height:8px"></div>
                <div class="row">
                    <div class="col">
                        <div class="d-inline-flex p-2 text-break" style="background-color:rgba(0, 132, 255, 0.527); border-radius:10px">
                            ${message.content}
                        </div>
                    </div>
                </div>
                `;
            }
            document.querySelector('#messages_view_body').append(message_element);
            window.scrollTo({top:document.body.scrollHeight, behavior:'instant'});
        });
    });

    let last_msg_id = 0;

    fetch(`api/temp_last_message/${chat.username}`)
        .then(response => response.json())
        .then(message => {console.log(message.msg_id); last_msg_id=message.msg_id})

    tmp_msg_interval = setInterval(()=>{
        fetch(`api/temp_last_message/${chat.username}`)
        .then(response => response.json())
        .then(message => {
            if(message.msg_id > last_msg_id){

                console.log(message.msg_id);
                last_msg_id = message.msg_id;

                const message_element = document.createElement('div');
                message_element.innerHTML = `
                <div style="height:8px"></div>
                <div class="row">
                    <div class="col">
                        <div class="d-inline-flex p-2 text-break" style="background-color:rgba(0, 132, 255, 0.527); border-radius:10px">
                            ${message.content}
                        </div>
                    </div>
                </div>
                `;
                if (window.innerHeight + window.scrollY >= document.body.offsetHeight){
                    document.querySelector('#messages_view_body').append(message_element);    
                    will_scroll_to_keep_end();
                }else{
                    document.querySelector('#messages_view_body').append(message_element);
                }
                function will_scroll_to_keep_end(){
                    scrollTo(0, document.body.scrollHeight)
                }
                
                
            }
        });
    },1000);

}
function chats_view(){
    hide_all_but_this_view('chats_view');
    //history.pushState({section: ''}, '', 'chats');

    document.querySelector('#chats').innerHTML='';

    //load chats
    fetch(`chats/`)
    .then(response => response.json())
    .then(chats => {
        chats.forEach(chat => {

        const chat_element = document.createElement('div')
        chat_element.innerHTML = `
        <div class="row" id="open_messages">
            <div class="col-auto">
                <img src="${chat.user_pfp_url}" class="img-fluid" style="border-radius:100%; aspect-ratio: 1 / 1; object-fit: cover; max-height:65px">
            </div>
            <div class="col-auto" style="padding:0px;">
                <b style="font-size:160%">${chat.username}</b>
                <div style="color:gray">ultima msg • há 11 min </div>
            </div>
        </div>
        <hr>`;
        chat_element.addEventListener('click', ()=>{
            messages_view(chat);
        })
        document.querySelector('#chats').append(chat_element);
        })
    });
}

function load_profile(who){
    hide_all_but_this_view('profile_view');

    history.pushState({section: who}, '', `/${who}`)

    const profile_header = document.querySelector('#profile_header');
    function header(){

        fetch(`/api/profile/${who}`)
        .then(response => response.json())
        .then(data => {

            function buttons(){{
                if (data.following_button == 'self'){
                    return `
                    <div class="col-auto" style="padding:0px">
                        <a type="button" href="/logout" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#edit_profile">Editar</a>
                    </div>
                    <div class="col-auto">
                        <a type="button" href="/logout" class="btn btn-secondary">Sair</a>
                    </div>
                    `
                }else{
                    let element = '';
                    if (data.following_button == 'true'){
                        element = `
                        <div id="follow_div" class="col-auto"  style="padding:0px">
                            <button id="follow_button" data-action="unfollow" type="button" class="btn btn-secondary">- Seguindo</button>
                        </div>
                        `}
                    else{
                        element = `
                        <div id="follow_div" class="col-auto"  style="padding:0px">
                            <button id="follow_button" data-action="follow" type="button" class="btn btn-primary">+ Seguir</button>
                        </div>
                        `}
                    
                    return`${element}
                    <div id="follow_div" class="col-auto">
                        <button id="messages_button" type="button" class="btn btn-primary">mensagens</button>
                    </div>`;
                    }
                }
            }

            profile_header.innerHTML = `
            <div class="container text-left">
            <div class="row">

                <div class="col-5" style="padding:20px 0px 0px 0px">
                    <div class="container">
                        <img src="${data.pfp_img_url}" class="img-fluid" style="border-radius:100%; aspect-ratio: 1 / 1; object-fit: cover;">
                    </div>
                </div>
                

                <div class="col-7" style="display:flex; align-items: center; padding:15px 0px 0px 0px;">
                    <div class="container">
                        <div class="row">
                            <h1>${data.username}</h1>
                        </div>  

                        <div class="row" style="text-align:center">
                            <div class="col-6">

                                <div class="row justify-content-center">
                                    <div class="col-12">
                                        ${data.following_count}
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-12">
                                       seguindo
                                    </div>
                                </div>
                            </div>

                            <div class="col-6">

                                <div class="row justify-content-center">
                                    <div class="col-12" id="followers_count">
                                        ${data.followers_count}
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-12">
                                       seguidores
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row" style="height:10px"></div>
                        
                        <div class="row">
                            ${buttons()}
                        </div>
                        
                    </div>
                </div>
            </div>
            </div>
            `;
            //messages button
            document.querySelector('#messages_button').addEventListener('click', ()=>{
                fetch('/add_chat/'+data.username);
                chats_view();
            })

            //follow button
            follow_button = document.querySelector('#follow_div')
            follow_button.addEventListener('click', ()=>{
                if(logged){
                let followers_count_element = document.querySelector("#followers_count");
                let followers = parseInt(followers_count_element.innerHTML);
                fetch(`/follow/${data.username}?action=${document.querySelector('#follow_button').dataset.action}`);
                
                    if (data.following_button == 'false'){
                        data.following_button = 'true';
                        follow_button.innerHTML = `<button id="follow_button" data-action="unfollow" type="button" class="btn btn-secondary">- Seguindo</button>`;
                        followers_count_element.innerHTML = followers+1;
                    }
                    else{
                        data.following_button = 'false';
                        follow_button.innerHTML = `<button id="follow_button" data-action="follow" type="button" class="btn btn-primary">+ Seguir</button>`;
                        followers_count_element.innerHTML = followers-1;
                    }
                }else{
                    alert("é necessário o login!")
                }
            })
        });
        
    };

    header();
    load_feed(who, 'profile_feed');
}

function create(){
    
    history.pushState({section: ''}, '', '/');
    hide_all_but_this_view('create_form');

    document.querySelector('#create_form').onsubmit = (event) => {
        if (document.querySelector("#content").value == ''){
            alert('post vazio');
            return false;
        }
    }
}

function post_view(post){
    hide_all_but_this_view('post_view');

    document.querySelector(`#main_post`).innerHTML="";
    document.querySelector(`#post_comments`).innerHTML='';


    //accessd by link or click (-1 fetch request if click)?
    if (typeof(post) == 'string'){//ou seja, uma URL
        fetch(`/api/post/${post}`)
        .then(reponse => reponse.json())
        .then(post => {
            document.querySelector(`#main_post`).append(post_obj(post));
        });
    }else{
        history.pushState({section: ''}, '', '/post/'+post.id);
        document.querySelector(`#main_post`).append(post_obj(post));
        document.querySelector(`#post_id_for_comment`).value=`/post/${window.location.pathname.split('/')[2]}`;
    }

    document.querySelector('#comment_form').onsubmit = () => {
        if(document.querySelector("#comment_content").value == ''){
            alert('post vazio');
            return false;
        }
        if(!logged){
            alert('necessário o login para comentar!');
            return false;
        }
    }

    start=0
    end=7
    hydrate_toggle = 'true'
    if (hydrate_toggle == 'true'){
        function hydrate_posts(){
            fetch(`/feed/post_comments?post_id=${window.location.pathname.split('/')[2]}&start=${start}&end=${end}`)
            .then(response => response.json())
            .then(posts => {
                if (posts[0] == 'null'){
                    hydrate_toggle = 'false';
                    console.log('fim da tl!, hydrate posts disabilitado');
                }
                posts.forEach(sex => {
                    if (sex != 'null'){
                        document.querySelector(`#post_comments`).append(post_obj(sex));
                    }
                });
            })
        }
    }
    //infinite scroll
    window.onscroll = ()=>{
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight){
            start=end;
            end += 7;
            if (hydrate_toggle == 'true'){
            hydrate_posts()}
        }
    }

    hydrate_posts();
    
}

function post_obj(post){
    
    function image_if_any(){
        if (post.image  != ''){
            return `<img src="${post.image}" class="img-fluid" style="border-radius:5px"></img>`
        }else{
            return ''
        }
    }

    function post_options(){
        if (post.yours == 'true'){
            return `
            <div id="post_options" class="col-2" data-bs-toggle="modal" data-bs-target="#post_options_owner" style="text-align:right; padding: 0px 20px">
                <i class="bi bi-three-dots"></i>
            </div>
            `
        }else{
            return ''
        }
    }

    const element = document.createElement('div');
    element.innerHTML = `
    <div style="border-color: gray; border-width:1px; border-radius:5px; border-style: solid; margin:10px; padding:5px;">
        
        <div class="row align-items-center">

            <div class="col-10">
                <div id="username" class="row align-items-center" style="padding:3px 5px 7px 5px">

                <div class="col-auto">
                    <img src="${post.pfp_img_url}" class="img-fluid" style="border-radius:100%; height:30px; aspect-ratio: 1 / 1; object-fit: cover;"></img>
                </div>
                
                <div class="col-auto" style="padding:0px">
                    <b>${post.user}</b>
                </div>

                </div>
            </div>
            
            ${post_options()}

        </div>
        
        
        ${image_if_any()}
        <div style="height:5px"></div>
        <div>${post.content}</div>

        <div class="row align-items-center">

            <div class="col-7">
                <div style="padding:5px; color:gray">${moment(post.timestamp).locale('pt-BR').fromNow()}</div>
            </div>
            <div class="col-5 d-flex flex-row-reverse">
                <div id="like" style="padding:5px;"></div>
                <div style="padding:5px;"><i class="bi bi-chat"></i>&#8287;&#8287;${post.comments_count}</div>
            </div>
        </div>

    </div>
    `;

    //post options view
    if (post.yours == 'true'){
        element.querySelector('#post_options').addEventListener('click', (e) => {
            e.stopPropagation()
            //delete button
            document.querySelector('#delete_post_button').addEventListener('click', ()=>{
                fetch(`/api/delete_post/${post.id}`)
                .then(()=>{load_feed('all', 'feed')});    
                document.querySelector('#delete_post_button').outerHTML = document.querySelector('#delete_post_button').outerHTML;
            });
        })
    }
    
    //specific post view on click
    element.addEventListener('click', (e) => {
        e.stopPropagation()
        post_view(post);
    })
    //profile-view on click
    element.querySelector('#username').addEventListener('click', (e) => {
        e.stopPropagation()
        load_profile(post.user);
    })
    //like button
    let like_div = element.querySelector('#like')
    like_div.addEventListener('click', (e) => {e.stopPropagation();like(post, like_div)});
    if(post.liked == "true"){
        like_div.innerHTML = `<i style="color:red" class="bi bi-heart-fill"></i> &#8287;&#8287;${post.likes}`;
    }else{
        like_div.innerHTML = `<i class="bi bi-heart"></i> &#8287;&#8287;${post.likes}`;
    }
    return element;
}

function hide_all_but_this_view(view){
    document.querySelector('#messages_view').style.display="none";
    document.querySelector('#create_form').style.display="none";
    document.querySelector('#profile_view').style.display="none";
    document.querySelector('#feed_view').style.display="none";
    document.querySelector('#post_view').style.display="none";
    document.querySelector('#chats_view').style.display="none";

    document.querySelector(`#${view}`).style.display="block";
    try{
        clearInterval(tmp_msg_interval)
    }catch{}
}

function load_feed(type, where){
    start=0;
    end=7;

    if (where != 'profile_feed'){
        hide_all_but_this_view('feed_view')
        history.pushState({section: ''}, '', '/');
    }

    //reset feed
    document.querySelector('#feed').innerHTML=" ";
    document.querySelector('#profile_feed').innerHTML=" ";

    //main feed header selector
    if (type == 'all'){
        document.querySelector("#recentes_header").style.textDecoration = "underline";
        document.querySelector("#seguindo_header").style.textDecoration = "none";

    }else{
        document.querySelector("#recentes_header").style.textDecoration = "none";
        document.querySelector("#seguindo_header").style.textDecoration = "underline";
    }

    function feed_type(){
        if (where=="feed"){
            return `/feed/${type}?start=${start}&end=${end}`
        }else if(where=='profile_feed'){
            return `/feed/profile?username=${type}&start=${start}&end=${end}`
        }else if(where=="post_comments"){
            return `/feed/post_comments?post_id=${type}&start=${start}&end=${end}`
        }
    }

    hydrate_toggle = 'true'
    if (hydrate_toggle == 'true'){
        function hydrate_posts(){
            fetch(feed_type())
            .then(response => response.json())
            .then(posts => {
                if (posts[0] == 'null'){
                    hydrate_toggle = 'false';
                    console.log('fim da tl!, hydrate posts disabilitado');
                }
                posts.forEach(post => {
                    if (post != 'null'){
                    document.querySelector(`#${where}`).append(post_obj(post))}
                });
            })
        }
    }

    //infinite scroll
    window.onscroll = ()=>{
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight){
            start=end;
            end += 7;
            if (hydrate_toggle == 'true'){
            hydrate_posts()}
        }
    }

    hydrate_posts();
}

function like(post, element){

    if(logged){
        if(post.liked == "false"){
            post.liked = "true";
            post.likes ++;
            element.innerHTML = `<i style="color:red" class="bi bi-heart-fill"></i> &#8287;&#8287;${post.likes}`;
        }else{
            post.liked = "false";
            post.likes --;
            element.innerHTML = `<i class="bi bi-heart"></i> &#8287;&#8287;${post.likes}`;
        }

        fetch(`/api/post/${post.id}`, {
            method: 'PUT',
            headers: {'X-CSRFToken':document.querySelector('[name=csrfmiddlewaretoken]').value},
            mode: 'same-origin',
            body: JSON.stringify({
                liked: post.liked,
            })
        })
    }else{
        alert("é necessário o login!")
    }
}
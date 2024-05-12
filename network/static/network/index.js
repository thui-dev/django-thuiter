//sets default light theme 
if (!localStorage.getItem('theme')){
    localStorage.setItem('theme', 'light');} 
document.querySelector('html').setAttribute('data-bs-theme',localStorage.getItem('theme'))



document.addEventListener('DOMContentLoaded', () => {

    //ajeitando pathname to be passed in as variable
    let pathname = window.location.pathname.split('/')
    console.log(pathname)

    //load user profile, post or feed_all
    if (pathname[1] == 'post'){
        post_view(pathname[2]);
    }else if (pathname[1] == ''){
        load_feed('all', 'feed');
    }else{
        load_profile(pathname[1]);
    }

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

    document.querySelector('#logo').addEventListener('click', () => location.replace('/'));
    //bottom navbar, if logged in
    try{
        document.querySelector('#create').addEventListener('click', () => create());
        document.querySelector('#following').addEventListener('click', () => load_feed('following', 'feed'));
        document.querySelector('#chat_button').addEventListener('click', ()=>messages_view())
        document.querySelector('#user-profile').addEventListener('click', () => {
            load_profile(document.querySelector('#user-profile').dataset.username)
        });
        logged=true;
    }catch{
        logged = false;
    }

    //feed view navbar(all/following)
    document.querySelector("#recentes_header").addEventListener('click', ()=>{load_feed('all', 'feed')});
    document.querySelector("#seguindo_header").addEventListener('click', ()=>{load_feed('following', 'feed')});
    
});

function messages_view(){
    document.querySelector('#create_form').style.display="none";
    document.querySelector('#feed_view').style.display="none";
    document.querySelector('#profile_view').style.display="none";
    document.querySelector('#post_view').style.display="none";
    document.querySelector('#messages_view').style.display="block";
}

function load_profile(who){
    //hide everything else
    document.querySelector('#create_form').style.display="none";
    document.querySelector('#feed_view').style.display="none";
    document.querySelector('#profile_view').style.display="block";
    document.querySelector('#post_view').style.display="none";
    document.querySelector('#messages_view').style.display="none";

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
                    if (data.following_button == 'true'){
                        return `
                        <div id="follow_div" class="col-auto">
                            <button id="follow_button" data-action="unfollow" type="button" class="btn btn-secondary">- Seguindo</button>
                        </div>
                        `}
                    else{
                        
                        return `
                        <div id="follow_div" class="col-auto">
                            <button id="follow_button" data-action="follow" type="button" class="btn btn-primary">+ Seguir</button>
                        </div>`}
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

    //hide
    document.querySelector('#feed_view').style.display="none";
    document.querySelector('#profile_view').style.display="none";
    document.querySelector('#create_form').style.display="block";
    document.querySelector('#post_view').style.display="none";
    document.querySelector('#messages_view').style.display="none";


    /*
    document.querySelector('#create_form').onsubmit = (event) => {

        load_feed('all', 'feed');
        setTimeout(()=>{load_feed('all', 'feed')}, 1000);
        return false;
    }*/
}

function post_view(post){

    //hide
    document.querySelector('#messages_view').style.display="none";
    document.querySelector('#create_form').style.display="none";
    document.querySelector('#profile_view').style.display="none";
    document.querySelector('#feed_view').style.display="none";
    document.querySelector('#post_view').style.display="block";

    document.querySelector(`#main_post`).innerHTML="";

    //accessd by link or click (-1 fetch request if click)?
    if (typeof(post) == 'string'){
        fetch(`/api/post/${post}`)
        .then(reponse => reponse.json())
        .then(post => {
            document.querySelector(`#main_post`).append(post_obj(post));
        })
    }else{
        history.pushState({section: ''}, '', '/post/'+post.id);
        document.querySelector(`#main_post`).append(post_obj(post));
    }
    
    document.querySelector('#delete_post_button').addEventListener('click', ()=>{
        console.log(post.id);
        fetch(`/api/delete_post/${post.id}`)
        .then(()=>{load_feed('all', 'feed')});
        
    });

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
            <div class="col-2" data-bs-toggle="modal" data-bs-target="#post_options_owner" style="text-align:right; padding: 0px 20px">
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
        
        <div style="display:flex; justify-content:right">
            <div id="like" style="padding:5px;"></div>
        </div>
    </div>
    `;
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

function load_feed(type, where){

    start=0;
    end=7;

    //hide everything else if not profile
    if (where != 'profile_feed'){

        //hide
        document.querySelector('#messages_view').style.display="none";
        document.querySelector('#create_form').style.display="none";
        document.querySelector('#profile_view').style.display="none";
        document.querySelector('#feed_view').style.display="block";
        document.querySelector('#post_view').style.display="none";

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

    function hydrate_posts(start, end, where){
        fetch(`/feed/${type}?start=${start}&end=${end}`)
        .then(response => response.json())
        .then(posts => {
            posts.forEach(post => {
                document.querySelector(`#${where}`).append(post_obj(post));
            });
        })
    }
    //infinite scroll
    window.onscroll = ()=>{
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight){
            start=end;
            end += 7;
            hydrate_posts(start, end, where);
        }
    }  
    hydrate_posts(start, end, where);
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
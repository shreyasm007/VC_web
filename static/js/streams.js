const APP_ID = 'a3fde44dc93d457dbd8cc347041e1f31'
const CHANNEL = sessionStorage.getItem('room')
const TOKEN = sessionStorage.getItem('token')
const UID = Number(sessionStorage.getItem('UID'))
let NAME = sessionStorage.getItem('name')

const client =  AgoraRTC.createClient({mode:'rtc', codec:'vp8'})

let localTracks = []
let remoteUsers = {}


let joinAndDisplayLocalStream = async() => {
    document.getElementById('room-name').innerText = CHANNEL

    client.on('user-published', handleUserJoined)
    client.on('user-left', handleUserLeft)
    try{
        await client.join(APP_ID, CHANNEL, TOKEN, UID)
    }catch(error){
        console.error(error)
        window.open('/', '_self')
    }
   

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()
     
    let member = await createMember()

    let player =  `<div class="video-container" id="user-container-${UID}">
                      <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                      <div class="video-player" id="user-${UID}"></div>
                  </div>`
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
    localTracks[1].play(`user-${UID}`)

    await client.publish([localTracks[0], localTracks[1]])
}

let handleUserJoined = async (user, mediaType) =>{
    remoteUsers[user.uid] = user
    await client.subscribe(user, mediaType)

    if(mediaType === 'video'){
        let player = document.getElementById(`user-container-${user.uid}`)
        if(player != null){
         player.remove()    
        }

        let member = await getMember(user)

        player =  `<div class="video-container" id="user-container-${user.uid}">
                      <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                      <div class="video-player" id="user-${user.uid}"></div>
                  </div>`
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
        user.videoTrack.play(`user-${user.uid}`)

    }

    if(mediaType === 'audio'){
        user.audioTrack.play()
    }
}

let handleUserLeft = async(user) =>{
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async() => {
    for(let i=0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    await client.leave()

    deletMember()
    window.open('/', '_self')
}

let toggleCamera = async (e) =>{
     if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        document.getElementById('cam-btn').style.backgroundColor = "white"
     }else{
         await localTracks[1].setMuted(true)
         document.getElementById('cam-btn').style.backgroundColor = "red"
     }
}

let togglemic = async (e) =>{
    if(localTracks[0].muted){
       await localTracks[0].setMuted(false)
       document.getElementById('mic-btn').style.backgroundColor = "white"
    }else{
        await localTracks[0].setMuted(true)
        document.getElementById('mic-btn').style.backgroundColor = "red"
    }
}

let createMember = async () => {
    let response = await fetch('/create_member/',{
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name': NAME, 'room_name':CHANNEL,'UID':UID })
     })

     let member = await response.json()
     return member 
}

let getMember = async (user) =>{
    let response = await fetch(`/get_member/?UID=${user.uid}&room_name=${CHANNEL}`)
    let member = await response.json()
    return member
}

let deletMember = async () => {
    let response = await fetch('/delete_member/',{
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name': NAME, 'room_name':CHANNEL,'UID':UID })
     })

     let member = await response.json()
   
}


joinAndDisplayLocalStream()  

window.addEventListener('beforeunload', deletMember)

document.getElementById('like-btn').addEventListener('click',leaveAndRemoveLocalStream)
document.getElementById('cam-btn').addEventListener('click',toggleCamera)
document.getElementById('mic-btn').addEventListener('click',togglemic)
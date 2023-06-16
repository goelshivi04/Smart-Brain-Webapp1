import React, {Component} from 'react';
import ParticlesBg from 'particles-bg';
import './App.css';
import Navigation from './Components/Navigation/Navigation'; 
import Logo from './Components/Logo/Logo'; 
import ImageLinkForm from './Components/ImageLinkForm/ImageLinkForm';
import Rank from './Components/Rank/Rank';
import SignIn from './Components/SignIn/SignIn';
import Register from './Components/Register/Register';
import FaceRecognition from './Components/FaceRecognition/FaceRecognition';


const returnClarifaiRequestOptions =(imageUrl)=>{
    const PAT = '69b9b086e24742be9904d04f08ac6718';
    const USER_ID = 'qwerty123456';       
    const APP_ID = 'test';
    // const MODEL_ID = 'face-detection';
    const IMAGE_URL = imageUrl;

    const raw = JSON.stringify({
        "user_app_id": {
            "user_id": USER_ID,
            "app_id": APP_ID
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "url": IMAGE_URL
                    }
                }
            }
        ]
    });

    const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + PAT
        },
        body: raw
    };

    return requestOptions;

}
    

class App extends Component {
  
  constructor(){
    super();
    this.state = {
      input: '',
      imageUrl: '',
      box:[], // box:{} for single face
      route: 'signin',
      isSignedIn: false, 
      user :{
        id:'',
        name: '',
        email: '',
        entries: 0,
        joined:''
      }
    }
  }


  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined
    }})
  }



  //-----------------------to detect single face------------------------------------------------------  
  // calculateFaceLocation = (data) =>{

  //   const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
  //   console.log(data);
  //   const image = document.getElementById('inputimage');
  //   const width=Number(image.width);
  //   const height=Number(image.height);
  //   return {
  //     leftCol: clarifaiFace.left_col * width,
  //     topRow: clarifaiFace.top_row * height,
  //     rightCol: width - (clarifaiFace.right_col * width),
  //     bottomRow: height - (clarifaiFace.bottom_row * height)
  //   }

  // }




  //to detect multiple faces

   calculateFaceLocation = (data) =>{
    
    const image = document.getElementById('inputimage');
    let result=[];
    // let data1=[];
    data=data.outputs[0].data.regions;
    if(Array.isArray(data)){
      data.forEach((item) =>{
        result.push(item.region_info.bounding_box);
      }
      );
    }
    else{
      this.setState((prev) => ({
        ...prev,
        hasError: true,
      }));
    }

    let box = []; 
    const width=Number(image.width);
    const height=Number(image.height);
    result.forEach((item) => {
      box.push({
        leftCol: item.left_col * width,
        topRow: item.top_row * height,
        rightCol: width - (item.right_col * width),
        bottomRow: height - (item.bottom_row * height)
      });
    });
      
    // console.log(width,height);
    return box;
  }


  displayFaceBox = (box) => {
    // console.log(box);
    this.setState({box: box});
  }


  onInputChange = (event) =>{
    this.setState({input: event.target.value});
  }


onButtonSubmit = () => {
    this.setState({imageUrl: this.state.input}); 
    const MODEL_ID = 'face-detection';
   fetch("https://api.clarifai.com/v2/models/"+  MODEL_ID+  "/outputs", returnClarifaiRequestOptions(this.state.input))
      .then(response => response.json())
      .then(response => {
        if(response){
          fetch('http://localhost:3001/image',{
            method:'put',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
            id:this.state.user.id
            })
          })

          .then(response => response.json())
          .then(count => {
            this.setState(Object.assign(this.state.user,{entries: count}))
          })
        }
        this.displayFaceBox(this.calculateFaceLocation(response))
      })
      .catch(err => console.log(err));
  }


  onRouteChange = (route) => {
    if(route === 'signout'){
      this.setState ({isSignedIn: false})
    }
    else if(route === 'home'){
      this.setState ({isSignedIn: true}) 
    }
    this.setState({route: route});
  }

  render(){
    const {isSignedIn, imageUrl, route, box} = this.state;
    return (
    <div className="App">
      <ParticlesBg type="circle" bg={true} />
      <Navigation isSignedIn ={isSignedIn} onRouteChange={this.onRouteChange}/>
      { route === 'home'
        ? <div>
            <Logo />
            <Rank 
            name={this.state.user.name} 
            entries={this.state.user.entries}
            />
            <ImageLinkForm 
              onInputChange={this.onInputChange}
              onButtonSubmit={this.onButtonSubmit}
            />
            <FaceRecognition box={box} imageUrl={imageUrl}/>
          </div>
        : (
            route === 'signin'
            ? <SignIn loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
            : <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
          )
        
    }
    </div>
    );
  }
}

export default App;




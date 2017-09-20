import React from 'react';
import ReactDOM from 'react-dom';
import { ajax } from 'jquery';
import firebase, {auth, provider} from './firebase.js';

const dbRef = firebase.database().ref('/playlists');

// get input from user
class Form extends React.Component{
	constructor(props){
		super();
		this.state = {
			time: '',
			movies: [],
			quality: 1
		}
		this.handleChange = this.handleChange.bind(this);
		this.submitForm = this.submitForm.bind(this);
	}
	submitForm(event){
		event.preventDefault();
		this.props.reset();
		let pageMin = this.state.quality* 10 - 9;
		let pageMax = this.state.quality* 10;
		ajax({
			url: `https://api.themoviedb.org/3/discover/movie`,
			data: {
				api_key: `0cff5ebc18cb240711f23c9648e60c99`,
				sort_by: 'vote_average.desc',
				with_original_language: 'en',
				'vote_count.gte': 150,
				'with_runtime.gte': 60,
				'with_runtime.lte': 360,
				page: Math.floor(Math.random() * (pageMax - pageMin) + pageMin),
			}
		}).then((res) => {
			const pages = res.total_pages;
			const movies = res.results;
			this.props.onAcceptTime(this.state.time);
			this.props.onAcceptResults(movies);
		});
	}
	handleChange(event){
		this.setState({

			[event.target.name]: event.target.value
		});
	}
	render(){
		return(
			<form className='userInput' onSubmit={(event) => this.submitForm(event)}>
				<h2>How much time do you have?</h2>
				<div className="hours">
					<input required type='number' name='time' min='2' step="any" onChange={(event) => this.handleChange(event)}/>
					<label htmlFor="time">hours</label>
				</div>
				<h2>...what quality are you looking for?</h2>
				<div className="slider">
					<label htmlFor="quality"><i className="fa fa-thumbs-o-up" aria-hidden="true"></i></label>
					<input type="range" name='quality' min="1" max="20" defaultValue="1" onChange={(event) => this.handleChange(event)}/>
					<label htmlFor="quality"><i className="fa fa-thumbs-o-down fa-flip-horizontal" aria-hidden="true"></i></label>
				</div>
				<button>Submit</button>
			</form>
		);
	}
}

// header functionality (authentication)
class Header extends React.Component{
	render(){
		return(
			<header>
				<div className="wrapper">
					<img src="./assets/film-reel.svg" alt="Film reel"/>
					<h1>Playlist Picker</h1>
					{/*Created by Bohdan Burmich*/}
					{/*from the Noun Project*/}
					{this.props.user ?
						<button onClick={this.props.logout}>Log Out</button>
						:
						<button onClick={this.props.login}>Log In</button>
					}
				</div>
			</header>
		)
	}
}

// display results to user
class ResultsContainer extends React.Component{
	constructor(){
		super();
		this.savePlaylist = this.savePlaylist.bind(this);
	}
	savePlaylist(event){
		event.preventDefault();
		const playlist = this.props.playlist;
		dbRef.push(playlist);
	}
	retry(event){
		event.preventDefault();
	}
	render(){
		return(
			<div className="resultsContainer">
				<h2>Here's your playlist!</h2>
				<div className="moviesContainer">
					{
						this.props.playlist.map((movie) => {
							return(
								<Movie 
									movieBackdrop = {movie.backdrop_path}
									moviePoster = {movie.poster_path}
									movieTitle = {movie.original_title}
									movieTagline = {movie.tagline}
									movieDescription = {movie.overview}
									key = {movie.id}
								/>
							);
						})
					}
				</div>
				<h3>You have {this.props.availableTime} minutes remaining for popcorn breaks!</h3>
				<div className="buttonContainer">
					<button onClick={this.savePlaylist}>Save</button>
					<button onClick={this.props.retry}>Retry</button>
				</div>
			</div>
		);
	}
}

class Movie extends React.Component{
	render(){
		let backgroundStyles = {
			backgroundImage: `url(https://image.tmdb.org/t/p/w500/${this.props.movieBackdrop})`
		}
		return(
			<div className="movieContainer" style={backgroundStyles}>
				<div className="overlay">
					<img className ="poster" src={`https://image.tmdb.org/t/p/w154/${this.props.moviePoster}`} alt="Movie Poster"/>
					<div className="movieText">
						<h2>{this.props.movieTitle}</h2>
						<h4>{this.props.movieTagline}</h4>
						<p>{this.props.movieDescription}</p>
					</div>
				</div>
			</div>
		)
	}
}

// the master app component
class App extends React.Component {
	constructor(){
		super();
		this.state = {
			movies: [],
			timeInMinutes: 0,
			playlist: [],
			playlistComplete: false,
			availableTime: 0,
			user: null,
			retryButton: false,
			playlists: []
		}
		this.getUser = this.getUser.bind(this);
		this.toggleTrue = this.toggleTrue.bind(this);
		this.toggleFalse = this.toggleFalse.bind(this);
		this.login = this.login.bind(this);
		this.logout = this.logout.bind(this);
		this.removeSaved = this.removeSaved.bind(this);
	}
	componentDidMount() {
		auth.onAuthStateChanged((user) => {
			if(user){
				this.setState({
					user: user,
				});
			}
		});
		dbRef.on('value', (snapshot) => {
			const newItemsArray = [];
			const firebaseItems = snapshot.val();
			for (let key in firebaseItems){
				const firebaseItem = firebaseItems[key];
				firebaseItem.id = key;
				newItemsArray.push(firebaseItem);
			}
			this.setState({
				playlists: newItemsArray,
			});
		});
	}
	login() {
		auth.signInWithPopup(provider) 
		.then((result) => {
			const user = result.user;
				this.setState({
				user: user,
			});
			this.props.getUser(this.state.user);
		});
	}
	logout() {
		auth.signOut()
		.then(() => {
			this.setState({
				user: null
			});
			this.props.getUser(this.state.user);
		});
	}
	acceptResults(movieList){
		this.setState({
			movies: movieList,
		});
		this.createPlaylist();
	}
	acceptTime(hours){
		let minutes = hours * 60;
		this.setState({
			timeInMinutes: minutes,
		});
	}
	createPlaylist(){
		let playlist = [];
		let availableTime = this.state.timeInMinutes;
		for(let i = 0; i < this.state.movies.length; i++){
			let movieId = this.state.movies[i].id;
			ajax({
				url: `https://api.themoviedb.org/3/movie/${movieId}`,
				data: {
					api_key: `0cff5ebc18cb240711f23c9648e60c99`,
					language: 'en-US',
				}
			}).then((res) => {
				let runtime = res.runtime;
				let movieFits = runtime < availableTime;
				if(movieFits === true){
					playlist.push(res);
					availableTime = availableTime - runtime;
				}
				this.setState({
					playlist: playlist,
					availableTime: availableTime,
				});
				if(i === (this.state.movies.length - 1)){
					this.setState({
						playlistComplete: true,
					});
				}
			});
		}
	}
	displayContent(){
		if(this.state.playlistComplete === false || this.state.retryButton === true){
			return(
				<Form 
					onAcceptResults={(movieList) => this.acceptResults(movieList)}
					onAcceptTime={(hours) => this.acceptTime(hours)}
					reset={this.toggleFalse}
				/>
			);
		}
		else{
			return(
				<ResultsContainer 
					playlist={this.state.playlist}
					availableTime={this.state.availableTime}
					retry={this.toggleTrue}
				/>
			);
		}
	}
	toggleTrue(){
		this.setState({
			retryButton: true,
		});
	}
	toggleFalse(){
		this.setState({
			retryButton: false,
		});
	}
	getUser(user){
		this.setState({
			user: user,
		});
	}
	savedPlaylists(){
		return(
			<aside className='savedContainer'>
				<h3>Saved Playlists</h3>
				<ul>
					{this.state.playlists.map(item => {
						return (
							<li key={item.id} className="savedPlaylist">
								{item.map(movie => {
									let backgroundSaved = {
										backgroundImage: `url(https://image.tmdb.org/t/p/w500/${movie.backdrop_path})`
									}
									return (
										<div className="savedMovie" key={movie.id} style={backgroundSaved}>
											<div className="overlay">
												<h4>{movie.original_title}</h4>
												<h5>{`Run Time: ${movie.runtime} minutes`}</h5>
											</div>
										</div>
									)
								})}
								<button onClick={() => this.removeSaved(item.id)}>Remove</button>
							</li>
						);
					})}
				</ul>
			</aside>
		)
	}
	removeSaved(key) {
		const itemRef = firebase.database().ref(`/playlists/${key}`);
		itemRef.remove();
	}
	render(){
		return(
			<div className='app'>
				<Header getUser={this.getUser} login={this.login} logout={this.logout} user={this.state.user}/>
				<main>
					{this.state.user ?
						<div className="wrapper">
							<div className="mainContainer">
								{this.displayContent()}
								{this.savedPlaylists()}
							</div>
							<img className="userProfile" src={this.state.user.photoURL}/>
						</div>
						:
						<div className="wrapper">
							<div className="loggedOut">
								<i className="fa fa-film aria-hidden"></i>
								<h6>You must be logged in to use the playlist picker</h6>
							</div>
						</div>
					}
				</main>
				<footer>
					<div className="wrapper">
						<h6>&copy; 2017 Brett Nielsen</h6>
						<img src="./assets/moviedb-logo.svg" alt="The Movie DB logo"/>
						<h6>Using The Movie DB API</h6>
					</div>
				</footer>
			</div>
		);
	}
}

// render "App"
ReactDOM.render(<App />, document.getElementById('app'));

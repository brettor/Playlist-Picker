import React from 'react';
import ReactDOM from 'react-dom';
import {
	BrowserRouter as Router,
	Route, Link } from 'react-router-dom';
import { ajax } from 'jquery';
import firebase, {auth, provider} from './firebase.js';

const dbRef = firebase.database().ref('/playlists');

// get input from user
class Form extends React.Component{
	constructor(){
		super();
		this.state = {
			time: '',
			movies: [],
		}
		this.handleChange = this.handleChange.bind(this);
		this.submitForm = this.submitForm.bind(this);
	}
	submitForm(event){
		event.preventDefault();
		let pageMin = this.state.quality* 10 - 9;
		let pageMax = this.state.quality* 10;
		console.log(pageMin, pageMax);
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
			console.log(res);
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
			<section className='userInterface'>
				<form onSubmit={(event) => this.submitForm(event)}>
					<h2>How much time do you have?</h2>
					<input type='number' name='time' onChange={(event) => this.handleChange(event)}/>
					<label htmlFor="time">hours</label>
					<h4>Video Quality</h4>
					<label htmlFor="quality">Good</label>
					<input type="range" name='quality' min="1" max="20" onChange={(event) => this.handleChange(event)}/>
					<label htmlFor="quality">Bad</label>
					<button>Submit</button>
				</form>
			</section>
		);
	}
}

// header functionality (authentication)
class Header extends React.Component{
	render(){
		return(
			<header>
				<div className="wrapper">
					<h1>Movie Playlist Generator</h1>
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
	savePlaylist(event){
		event.preventDefault();
		const playlist = this.props.playlist;
		dbRef.push(playlist);
	}
	render(){
		return(
			<div className="resultsContainer">
				<form>
					<h2>Here's your playlist!</h2>
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
					<h3>You have {this.props.availableTime} minutes remaining for popcorn breaks!</h3>
					<button onClick={this.savePlaylist}>Save</button>
					<button onClick={this.retry}>Retry</button>
				</form>
			</div>
		);
	}
}

class Movie extends React.Component{
	render(){
		return(
			<div className="movieContainer">
				<img src={`https://image.tmdb.org/t/p/w500/${this.props.movieBackdrop}`} alt="Movie Backdrop"/>
				<img src={`https://image.tmdb.org/t/p/w154/${this.props.moviePoster}`} alt="Movie Poster"/>
				<h2>{this.props.movieTitle}</h2>
				<h4>{this.props.movieTagline}</h4>
				<p>{this.props.movieDescription}</p>
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
			retryButton: false
		}
		this.getUser = this.getUser.bind(this);
		this.login = this.login.bind(this);
		this.logout = this.logout.bind(this);
	}
	componentDidMount() {
		auth.onAuthStateChanged((user) => {
			if(user){
				this.setState({
					user: user,
				});
			}
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
		if(this.state.playlistComplete === false || this.props.retryButton === true){
			return(
				<Form 
					onAcceptResults={(movieList) => this.acceptResults(movieList)}
					onAcceptTime={(hours) => this.acceptTime(hours)}
				/>
			);
		}
		else{
			return(
				<ResultsContainer 
					playlist={this.state.playlist}
					availableTime={this.state.availableTime}
				/>
			);
		}
	}
	getUser(user){
		this.setState({
			user: user,
		});
	}
	render(){
		return(
			<div className='app'>
				<Header getUser={this.getUser} login={this.login} logout={this.logout} user={this.state.user}/>
				<main>
					<div className="wrapper">
						{this.state.user ?
							<div>
								{this.displayContent()}
								<aside className='savedPlaylists'>
									<h3>Saved Playlists</h3>
									<ul></ul>
								</aside>
								<div className='user-profile'>
									<img src={this.state.user.photoURL} />
								</div>
							</div>
							:
							<div>
								<h2>You must be logged in to use the playlist generator.</h2>
							</div>
						}
					</div>
				</main>
				<footer>
					<div className="wrapper">
						<h6>&copy; 2017 Brett Nielsen</h6>
						<img src="/assets/moviedb-logo.svg" alt="The Movie DB logo"/>
						<h6>Using The Movie DB API</h6>
					</div>
				</footer>
			</div>
		);
	}
}

// render "App"
ReactDOM.render(<App />, document.getElementById('app'));

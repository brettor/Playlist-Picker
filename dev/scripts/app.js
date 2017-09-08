import React from 'react';
import ReactDOM from 'react-dom';
import {
	BrowserRouter as Router,
	Route, Link } from 'react-router-dom';
import { ajax } from 'jquery';

// get viewing length from user
class GetTime extends React.Component{
	constructor(){
		super();
		this.state = {
			time: ''
		}
		this.handleChange = this.handleChange.bind(this);
	}
	handleChange(event){
		this.setState({
			[event.target.name]: event.target.value
		})
	}
	render(){
		return(
			<input type="text" name="time" onChange={(event) => this.handleChange(event)}/>
		)
	}
}

// take the time from user and break into pieces of even length to get movies for (if statements)

// pass into ajax call to TMDb (with_runtime.gte or .lte)
class GetPlaylist extends React.Component{
	constructor(){
		super();
		this.state = {
			movies: []
		}
	}
	componentDidMount(){
		ajax({
			url: `https://api.themoviedb.org/3/discover/movie`,
			data: {
				api_key: `0cff5ebc18cb240711f23c9648e60c99`,
				sort_by: 'vote_average.desc',
				'with_runtime.lte': 90,
				'with_runtime.gte': 60,
				page: 1
			}
		}).then((res) => {
			const movies = res.results;
			this.setState({
				movies: movies
			})
		});
	}
	render(){
		console.log(this.state.movies);
		return(
			<div>I'm working!</div>
		)
	}
}

// create a playlist from returned results that equals user time +/- 30 min
// run detailed API call to get the rest of the info back for the selected movies (runtime, poster)
// display playlist on page 
// upon pressing save button, show playlist in saved section and save to firebase
// upon clicking remove button on saved playlist, remove it from server and from page


// the daddy app component
class App extends React.Component {
	render(){
		return(
			<div>
				<h1>I'm Working!</h1>
				<GetPlaylist />
				<GetTime />
			</div>
		)
	}
}

// render "App"
ReactDOM.render(<App />, document.getElementById('app'));

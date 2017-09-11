import firebase from 'firebase';

// Initialize Firebase
var config = {
	apiKey: "AIzaSyAAYMx5lzZ-zybRAmZp6mjL6gvOFUOnUp8",
	authDomain: "brett-nielsen-project6.firebaseapp.com",
	databaseURL: "https://brett-nielsen-project6.firebaseio.com",
	projectId: "brett-nielsen-project6",
	storageBucket: "brett-nielsen-project6.appspot.com",
	messagingSenderId: "725100097265"
};
firebase.initializeApp(config);
export const provider = new firebase.auth.GoogleAuthProvider();
export const auth = firebase.auth();
export default firebase;
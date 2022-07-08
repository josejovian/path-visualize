import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
	return (
		<>
			<div className="p-2">
				<Component {...pageProps} />
			</div>
		</>
	);
}

export default MyApp;

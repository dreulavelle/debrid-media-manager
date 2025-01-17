import Poster from '@/components/poster';
import { withAuth } from '@/utils/withAuth';
import getConfig from 'next/config';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

function RecentlyUpdated() {
	const { publicRuntimeConfig: config } = getConfig();
	const [searchResults, setSearchResults] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	const fetchData = async () => {
		setLoading(true);
		try {
			let path = 'api/recent';
			if (config.externalSearchApiHostname) {
				path = encodeURIComponent(path);
			}
			let endpoint = `${config.externalSearchApiHostname || ''}/${path}`;
			const res = await fetch(endpoint);
			const data = await res.json();
			setSearchResults(data);
		} catch (error: any) {
			setErrorMessage(error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	return (
		<div className="mx-4 my-8 max-w-full">
			<Head>
				<title>Debrid Media Manager - Recently Updated</title>
			</Head>
			<Toaster position="bottom-right" />
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-3xl font-bold">Recently Updated</h1>
				<Link
					href="/"
					className="text-2xl bg-cyan-800 hover:bg-cyan-700 text-white py-1 px-2 rounded"
				>
					Go Home
				</Link>
			</div>
			{loading && (
				<div className="flex justify-center items-center mt-4">
					<div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
				</div>
			)}
			{errorMessage && (
				<div className="mt-4 bg-red-900 border border-red-400 px-4 py-3 rounded relative">
					<strong className="font-bold">Error:</strong>
					<span className="block sm:inline"> {errorMessage}</span>
				</div>
			)}
			{searchResults.length > 0 && (
				<>
					<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
						{searchResults.map((key: string) => {
							const match = key.match(/^(movie|tv):(.+)/);
							if (match) {
								const mediaType = match[1] === 'movie' ? 'movie' : 'show';
								const imdbid = match[2];

								return (
									<Link key={key} href={`/${mediaType}/${imdbid}`} className="">
										<Poster
											imdbId={imdbid}
											className="w-full h-64 object-cover object-center rounded-t-lg"
										/>
									</Link>
								);
							}
							return null;
						})}
					</div>
				</>
			)}
		</div>
	);
}

export default withAuth(RecentlyUpdated);

import { filterByMovieConditions, getAllPossibleTitles, grabMovieMetadata } from '@/utils/checks';
import { scrapeBtdigg } from './btdigg-v2';
import { scrapeJackett } from './jackett';
import { ScrapeSearchResult, flattenAndRemoveDuplicates, sortByFileSize } from './mediasearch';
import { PlanetScaleCache } from './planetscale';
import { scrapeProwlarr } from './prowlarr';

type MovieScrapeJob = {
	titles: string[];
	year: string;
	airDate: string;
};

async function scrapeAll(
	finalQuery: string,
	targetTitle: string,
	airDate: string
): Promise<ScrapeSearchResult[][]> {
	return await Promise.all([
		scrapeBtdigg(finalQuery, targetTitle, airDate),
		scrapeProwlarr(finalQuery, targetTitle, airDate),
		scrapeJackett(finalQuery, targetTitle, airDate),
	]);
}

const processMovieJob = async (job: MovieScrapeJob): Promise<ScrapeSearchResult[][]> => {
	const results: ScrapeSearchResult[][] = [];
	for (let i = 0; i < job.titles.length; i++) {
		const title = job.titles[i];
		results.push(...(await scrapeAll(`"${title}" ${job.year}`, title, job.airDate)));
		results.push(...(await scrapeAll(`"${title}"`, title, job.airDate)));
	}
	return results;
};

export async function scrapeMovies(
	imdbId: string,
	tmdbData: any,
	mdbData: any,
	db: PlanetScaleCache,
	replaceOldScrape: boolean = false
): Promise<number> {
	const {
		cleanTitle,
		originalTitle,
		titleWithSymbols,
		alternativeTitle,
		cleanedTitle,
		year,
		airDate,
	} = grabMovieMetadata(imdbId, tmdbData, mdbData);

	await db.saveScrapedResults(`processing:${imdbId}`, []);

	const titles = getAllPossibleTitles([
		cleanTitle,
		originalTitle,
		cleanedTitle,
		titleWithSymbols,
		alternativeTitle,
	]);
	const searchResults = await processMovieJob({
		titles,
		year,
		airDate,
	});
	let processedResults = flattenAndRemoveDuplicates(searchResults);
	processedResults = filterByMovieConditions(cleanTitle, year, processedResults);
	if (processedResults.length) processedResults = sortByFileSize(processedResults);

	await db.saveScrapedResults(`movie:${imdbId}`, processedResults, replaceOldScrape);
	await db.markAsDone(imdbId);
	console.log(`🎥 Saved ${processedResults.length} results for ${cleanTitle}`);

	return processedResults.length;
}

import express from 'express';
import { readFileSync, writeFileSync } from 'fs';

const app = express();

// For testing purposes
var allowCrossDomain = function(req: any, res: any, next: any) {
    res.header('Access-Control-Allow-Origin', "http://localhost:3001");
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    express.json()(req, res, next);
};

app.use(express.json());

app.get('/', (req, res) => {
    res.send("Hello, World!");
});

app.get('/answer-today', async (req, res) => {
    const today = await actualWordToday();
    const answer = {
        current: today
    }
    res.send(answer);
})

type LetterResponse = {
    Letter: string,
    Position_Correct: boolean,
    In_Word: boolean
}

function compareGuess(actual: string, guess: string) : object {
    if (actual.length !== guess.length) return {'Error': `Length of guess (${guess.length}) does not match the expected length of ${actual.length}`}

    let charsActual: (string | null)[] = actual.toLowerCase().split("");
    let charsGuess: (string | null)[] = guess.toLowerCase().split("");

    let response : LetterResponse[] = guess.toLowerCase().split('').map((letter, ind): LetterResponse => {
        return {
            Letter: letter,
            Position_Correct: false,
            In_Word: false
        }
    });
  
    // Finds green tiles
    charsActual.forEach((val : string | null, ind : number) => {
      if (val === charsGuess[ind]) {
        response[ind].Position_Correct = true;
        response[ind].In_Word = true;
        charsActual[ind] = null;
        charsGuess[ind] = null;
      }
    })
  
    // Finds yellow tiles
    charsGuess.forEach((val: string | null, ind: number) => {
        if (val !== null && charsActual.includes(val)) {
          response[ind].In_Word = true;
          charsActual[charsActual.findIndex((v) => v === val)] = null;
        }
      })
  
    return response;
  }

app.get('/compare', async (req, res) => {
    const actual = req.query.actual;
    const guess = req.query.guess;
    let resp;

    if (!guess) { 
        resp = {"Error": "Missing required parameter 'guess'."};
    } else if (typeof guess !== 'string') {
        resp = {'Error': "Parameter 'guess' must be a single word."};
    } else if (!actual) {
        const actual = await actualWordToday();
        resp = compareGuess(actual, guess);
    } else if (typeof actual !== 'string') {
        resp = {'Error': "Parameter 'actual' must be a single word."};
    } else {
        resp = compareGuess(actual, guess);
    }

    res.send(resp);
})

async function actualWordToday() : Promise<string> {
    const localCache = './actual_today.json';
    const today = new Date(Date.now());

    const year = today.toLocaleString('en-US', {timeZone: "America/New_York", year: 'numeric'});
    const month = today.toLocaleString('en-US', {timeZone: 'America/New_York', month: '2-digit'});
    const day = today.toLocaleString('en-US', {timeZone: 'America/New_York', day: '2-digit'});
    const date = `${year}-${month}-${day}`;

    const cache = JSON.parse(readFileSync(localCache).toString());
    if (date in cache && typeof cache[date] === 'string') return cache[date];

    const link = `https://www.nytimes.com/svc/wordle/v2/${year}-${month}-${day}.json`;
    const resp = await fetch(link);
    const answer = await resp.json();
    writeFileSync(localCache, `{ "${date}": "${answer.solution}"}`);

    return answer.solution;
}

class Contains {
    letter: string;
    forbidden: number[];

    constructor (letter: string, forbidden_spots: number[]) {
        this.letter = letter;
        this.forbidden = forbidden_spots;
    }
}

function recurseGuess(word: string[], letters: string[], contains: Contains) {

}

export default app;
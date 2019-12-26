/**
 * Aggiunto :
 *  risultati di una partita gia finita
 *  risultati di una partita live,
 *  check partite in corso
 *  check partite finite
 *  *  classifica team
 * 
 * TODO Da aggiungere : 
 *  check ultime notizie (non funge, sono notizie dal forum)
 *  dati giocatori ??
 * 
 * 
 * 
 */
 
 //you need :
 // npm install --save ask-sdk-model
 // npm install --save ask-sdk-core
 // npm i string-similarity
 // npm i hltv

const { HLTV } = require('hltv')

var stringSimilarity = require('string-similarity')

squadra = "astralis"
teamNameThresholdSimilarity = 0.4


//get team ranking, gli elementi arrivano gia in ordine di punteggio 
async function getTeamRanking(){
    return new Promise(function (resolve) {
        HLTV.getTeamRanking().then((res) => {
            topTeams = []
            for(var i=0; i<5; i++){
                var teamJson = {
                    teamID: null,
                    teamName: null,
                    rank: null,
                    points: null
                }
                teamJson.teamID = res[i].team.id
                teamJson.teamName = res[i].team.name
                teamJson.rank = res[i].place
                teamJson.points = res[i].points
                topTeams.push(teamJson)
            }
            return resolve (topTeams)
        }).catch(console.error);
    });
}


//get live matches
async function getLatestMatches(){
    return new Promise(function (resolve) {
        HLTV.getMatches().then((res) => {
            
            matchesArr = []
            var i = 0
            while(true){
                var matchJson = {
                    team1: null,
                    team2: null,
                    id : null
                }
                if(res[i].live == true){
                    //console.log(res[i])
                    matchJson.team1 = res[i].team1.name
                    matchJson.team2 = res[i].team2.name
                    matchJson.id = res[i].id
                    //aggiungo la partita all-array
                    matchesArr.push(matchJson)
                    i=i+1
                }else{
                    return resolve (matchesArr)
                }
            }
        }).catch(console.error);
    });
}

//get results for last 5 matches
async function getLatestResults(){
    return new Promise(function (resolve) {
        HLTV.getResults(1).then((res) => {
           
            matchesArr = []
            for(var i=0; i<5; i++){
                var matchJson = {
                    team1: null,
                    team2: null,
                    team1Result : null,
                    team2Result : null
                }
                matchJson.team1 = res[i].team1.name
                matchJson.team2 = res[i].team2.name
                var result =  res[i].result.split("-");
                matchJson.team1Result = result[0]
                matchJson.team2Result = result[1]
                matchesArr.push(matchJson)
            }
            return resolve (matchesArr)
        }).catch(console.error);
    });
}


async function getResultForTeam(teamName){
    //ritorna risultati solo 1 pagina
    return new Promise(function (resolve) {
        HLTV.getResults(2).then((res) => {
            // controllo le prima 15 partite, se trovo la squadra return altrimenti vado avanti
            var matchJson = {
                team1: null,
                team2: null,
                team1Result : null,
                team2Result : null
            } 
            for(var i=0; i<15; i++){
                //console.log("simil con " + res[i].team1.name + " pari a " + stringSimilarity.compareTwoStrings(teamName, res[i].team1.name))
                //console.log("simil con " + res[i].team2.name + " pari a " + stringSimilarity.compareTwoStrings(teamName, res[i].team2.name))
                if(stringSimilarity.compareTwoStrings(teamName, res[i].team1.name.toLowerCase()) > teamNameThresholdSimilarity || stringSimilarity.compareTwoStrings(teamName, res[i].team2.name.toLowerCase()) > teamNameThresholdSimilarity){
                    //squadra trovata
                    //console.log("Squadra trovata " + res[i].team1.name + " or " + res[i].team2.name)
                    matchJson.id = res[i].id
                    matchJson.team1 = res[i].team1.name
                    matchJson.team2 = res[i].team2.name
                    var result =  res[i].result.split("-");
                    matchJson.team1Result = result[0]
                    matchJson.team2Result = result[1]
                    return resolve (matchJson)
                }
            }
            return resolve (null)
        }).catch(console.error);
    });
}


//Data una squadra controlla se sta giocando. se gioca ritorna id del amtch, altrimenti ritorna id del match di una loro partita recente. se non ce ne sono recenti da errore suppongo
function getMatchId(teamName){
    return new Promise(function (resolve) {
        HLTV.getMatches().then((res) => {
            var matchJson = {
                id : null,
                team1: null,
                team2: null,
                startTime : null
            }
            // controllo le prima 10 partite, se trovo la squadra return altrimenti vado avanti 
            for(var i=0; i<10; i++){
                //console.log("simil con " + res[i].team1.name + " pari a " + stringSimilarity.compareTwoStrings(teamName, res[i].team1.name))
                //console.log("simil con " + res[i].team2.name + " pari a " + stringSimilarity.compareTwoStrings(teamName, res[i].team2.name))
                //console.log(res[i])
                if(stringSimilarity.compareTwoStrings(teamName, res[i].team1.name.toLowerCase()) > teamNameThresholdSimilarity || stringSimilarity.compareTwoStrings(teamName, res[i].team2.name.toLowerCase()) > teamNameThresholdSimilarity){
                    //squadra trovata
                    //console.log("Squadra trovata " + res[i].team1.name + " or " + res[i].team2.name)
                    //console.log(res[i] )
                    
                    console.log(res[i])
                    matchJson.id = res[i].id
                    matchJson.team1 = res[i].team1.name
                    matchJson.team2 = res[i].team2.name
                    //convert from unix to time and get local start time of match
                    var date = new Date(res[i].date);
                    var hours = date.getHours();
                    var minutes = "0" + date.getMinutes();
                    var formattedTime = hours + ':' + minutes.substr(-2)
                    matchJson.startTime = formattedTime
                    //se é live ritorno id partita, altrimenti -1
                    if(res[i].live == true){
                        id = res[i].id
                    }else{
                        matchJson.id = -1
                    }
                    return resolve(matchJson);
                }
            }
            return resolve (null)
        }).catch(console.error);
    });
}


//recupero il risultato attuale di una partita in corso dato l'id della partita
async function getLiveMatch(id){
    return new Promise(function (resolve) {
        var matchJson = {
            ctTeam: null,
            tTeam: null,
            ctScore: null,
            tScore: null,
        }
        HLTV.connectToScorebot({id : id, 
        onScoreboardUpdate: (data) => {   
            //console.log(data)
            matchJson.tScore = data.tTeamScore
            matchJson.ctScore = data.ctTeamScore
            matchJson.ctTeam = data.ctTeamName
            matchJson.tTeam = data.terroristTeamName
            return resolve(matchJson);
        }})
        //console.log(HLTV.connectToScorebot)
    });
    return 0
  }

  
//recupera dati di una partita data una squadra
async function main(){
    
    try {
        match = await getMatchId(squadra);
    } catch (error) {
        console.log("Errore durante la ricerca della squadra : " + error);
    }
    
    // se non trovo nulla controllo vecchie partite e faccio notare che potrebbe gia essere finita
    if(match == null)
    {
        try {
            endedMatch = await getResultForTeam(squadra);
        } catch (error) {
            console.log("Errore durante la ricerca della squadra : " + error);
        }
        if(endedMatch == null){
            console.log("Non ho trovato nessuna partita")
        }else{
            //gli mostro il risultato della squadra vincente
            if(parseInt(endedMatch.team1Result) > parseInt(endedMatch.team2Result)){
                console.log("La partita è gia finita, gli " + endedMatch.team1 + " hanno vinto " + endedMatch.team1Result + " a " + endedMatch.team2Result + " contro gli " + endedMatch.team2)
            }else if(parseInt(endedMatch.team1Result) < parseInt(endedMatch.team2Result)){
                console.log("La partita è gia finita, gli " + endedMatch.team2 + " hanno vinto " + endedMatch.team2Result + " a " + endedMatch.team1Result + " contro gli " + endedMatch.team1)
            }else{
                console.log("La partita è gia finita in pareggio")
            }
        }

    //se -1 vuol dire che deve ancora iniziare
    }else if(match.id== -1 ){
        console.log("La partita inizierà alle " +match.startTime + " " + match.team1 + " vs " + match.team2)
    //se tutto va bene gli mostro quanto sta facendo la squadra vincente
    
    }else{
        try {
            match = await getLiveMatch(id);
            //mostro il vincitore
            if(parseInt(match.ctScore) > parseInt(match.tScore)){
                console.log("Al momento gli " + match.ctTeam + " stanno vincendo " + match.ctScore + " a " + match.tScore + " contro gli " + match.tTeam)
            }else if(parseInt(match.ctScore) < parseInt(match.tScore)){
                console.log("Al momento gli " + match.tTeam + " stanno vincendo " + match.tScore + " a " + match.ctScore + " contro gli " + match.ctTeam)
            }else{
                console.log("Al momento gli " + match.tTeam + " stanno pareggiando " + match.tScore + " a " + match.ctScore + " contro gli " + match.ctTeam)
            }
        } catch (error) {
            console.log("Errore durante il recupero della partita " + error);
        }
    }
    //process.exit()
}
//main()

//recupera classifica
async function main2(){
    try {
        matches = await getTeamRanking();
    } catch (error) {
        console.log("Errore durante la ricerca della squadra : " + error);
    }
    //console.log(matches)
    matches.forEach(element => {
        console.log(element.teamName )
    });
}

//main2()


//recupera partite in corso
async function main3(){
    try {
        matches = await getLatestMatches();
    } catch (error) {
        console.log("Errore durante la ricerca della squadra : " + error);
    }
    console.log(matches)
    matches.forEach(element => {
        console.log(element.teamName )
    });
}
//main3()

//recupera partite finite
async function main4(){
    try {
        matches = await getLatestResults();
    } catch (error) {
        console.log("Errore durante la ricerca della squadra : " + error);
    }
    //console.log(matches)
    matches.forEach(element => {
        console.log(element.team1 + " " + element.team1Result + " - " + element.team2Result + " " + element.team2 )
    });
}
main4()
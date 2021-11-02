// ############################################################################################################################
// Crossword Layout Generator - https://github.com/MichaelWehar/Crossword-Layout-Generator (edited)  ##########################
// ############################################################################################################################

// Math functions
function distance(x1, y1, x2, y2){
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function weightedAverage(weights, values){
    var temp = 0;
    for(let k = 0; k < weights.length; k++){
	temp += weights[k] * values[k];
    }
    
    if(temp < 0 || temp > 1){
	    console.log("Error: " + values);
    }
    
    return temp;
}


// Component scores
// 1. Number of connections
function computeScore1(connections, word){
    return (connections / (word.length / 2));
}

// 2. Distance from center
function computeScore2(rows, cols, i, j){
    return 1 - (distance(rows / 2, cols / 2, i, j) / ((rows / 2) + (cols / 2)));
}

// 3. Vertical versus horizontal orientation
function computeScore3(a, b, verticalCount, totalCount){
    if(verticalCount > totalCount / 2){
	return a;
    }
    else if(verticalCount < totalCount / 2){
	return b;
    }
    else{
	return 0.5;
    }
}

// 4. Word length
function computeScore4(val, word){
    return word.length / val;
}


// Word functions
function addWord(best, words, table){
    var bestScore = best[0];
    var word = best[1];
    var index = best[2];
    var bestI = best[3];
    var bestJ = best[4];
    var bestO = best[5];
    
    words[index].startx = bestJ + 1;			
    words[index].starty = bestI + 1;
    
    if(bestO == 0){
	for(let k = 0; k < word.length; k++){
	    table[bestI][bestJ + k] = word.charAt(k);
	}
	words[index].orientation = "across";
    }
    else{
	for(let k = 0; k < word.length; k++){
	    table[bestI + k][bestJ] = word.charAt(k);
	}
	words[index].orientation = "down";
    }
    //console.log(word + ", " + bestScore); I commented this out because it feels unnecessary
}

function assignPositions(words){
    var positions = {};
    for(let index in words){
        var word = words[index];
        if(word.orientation != "none"){
            var tempStr = word.starty + "," + word.startx;
            if(tempStr in positions){
	        word.position = positions[tempStr];
            }
            else{
                // Object.keys is supported in ES5-compatible environments
	        positions[tempStr] = Object.keys(positions).length + 1;
	        word.position = positions[tempStr];
            }
        }
    }
}

function computeDimension(words, factor){
    var temp = 0;
    for(let i = 0; i < words.length; i++){
	if(temp < words[i].answer.length){
	    temp = words[i].answer.length;
	}
    }
    
    return temp * factor;
}


// Table functions
function initTable(rows, cols){
    var table = [];
    for(let i = 0; i < rows; i++){
	for(let j = 0; j < cols; j++){
	    if(j == 0){
		table[i] = ["0"];
	    }
	    else{
		table[i][j] = "0";
	    }
	}
    }

    return table;
}

function isConflict(table, isVertical, character, i, j){
    if(character != table[i][j] && table[i][j] != "0"){
	return true;
    }
    else if(table[i][j] == "0" && !isVertical && (i + 1) in table && table[i + 1][j] != "0"){
	return true;
    }
    else if(table[i][j] == "0" && !isVertical && (i - 1) in table && table[i - 1][j] != "0"){
	return true;
    }
    else if(table[i][j] == "0" && isVertical && (j + 1) in table[i] && table[i][j + 1] != "0"){
	return true;
    }
    else if(table[i][j] == "0" && isVertical && (j - 1) in table[i] && table[i][j - 1] != "0"){
	return true
    }
    else{
        return false;
    }
}

function attemptToInsert(rows, cols, table, weights, verticalCount, totalCount, word, index){
    var bestI = 0;
    var bestJ = 0;
    var bestO = 0;
    var bestScore = -1;

    // Horizontal
    for(let i = 0; i < rows; i++){
	for(let j = 0; j < cols - word.length + 1; j++){
	    var isValid = true;
	    var atleastOne = false;
	    var connections = 0;
	    var prevFlag = false;
	    
	    for(let k = 0; k < word.length; k++){
		if(isConflict(table, false, word.charAt(k), i, j + k)){
		    isValid = false;
		    break;
		}
		else if(table[i][j + k] == "0"){
		    prevFlag = false;
		    atleastOne = true;
		}
		else{
		    if(prevFlag){
			isValid = false;
			break;
		    }
		    else{
			prevFlag = true;
			connections += 1;
		    }
		}
	    }
	    
	    if((j - 1) in table[i] && table[i][j - 1] != "0"){
		isValid = false;
	    }
	    else if((j + word.length) in table[i] && table[i][j + word.length] != "0"){
		isValid = false;
	    }
	    
	    if(isValid && atleastOne && word.length > 1){
		var tempScore1 = computeScore1(connections, word);
		var tempScore2 = computeScore2(rows, cols, i, j + (word.length / 2), word);
		var tempScore3 = computeScore3(1, 0, verticalCount, totalCount);
		var tempScore4 = computeScore4(rows, word);
		var tempScore = weightedAverage(weights, [tempScore1, tempScore2, tempScore3, tempScore4]);
		
		if(tempScore > bestScore){
		    bestScore = tempScore;
		    bestI = i;
		    bestJ = j;
		    bestO = 0;
		}
	    }
	}
    }
    
    // Vertical
    for(let i = 0; i < rows - word.length + 1; i++){
	for(let j = 0; j < cols; j++){
	    var isValid = true;
	    var atleastOne = false;
	    var connections = 0;
	    var prevFlag = false;
	    
	    for(let k = 0; k < word.length; k++){
		if(isConflict(table, true, word.charAt(k), i + k, j)){
		    isValid = false;
		    break;
		}
		else if(table[i + k][j] == "0"){
		    prevFlag = false;
		    atleastOne = true;
		}
		else{
		    if(prevFlag){
			isValid = false;
			break;
		    }
		    else{
			prevFlag = true;
			connections += 1;
		    }
		}
	    }
	    
	    if((i - 1) in table && table[i - 1][j] != "0"){
		isValid = false;
	    }
	    else if((i + word.length) in table && table[i + word.length][j] != "0"){
		isValid = false;
	    }
	    
	    if(isValid && atleastOne && word.length > 1){
		var tempScore1 = computeScore1(connections, word);
		var tempScore2 = computeScore2(rows, cols, i + (word.length / 2), j, word);
		var tempScore3 = computeScore3(0, 1, verticalCount, totalCount);
		var tempScore4 = computeScore4(rows, word);
		var tempScore = weightedAverage(weights, [tempScore1, tempScore2, tempScore3, tempScore4]);
		
		if(tempScore > bestScore){
		    bestScore = tempScore;
		    bestI = i;
		    bestJ = j;
		    bestO = 1;
		}
	    }
	}
    }
    
    if(bestScore > -1){
	return [bestScore, word, index, bestI, bestJ, bestO];
    }
    else{
	return [-1];
    }
}

function generateTable(table, rows, cols, words, weights){
    var verticalCount = 0;
    var totalCount = 0;
    
    for(let outerIndex in words){
	var best = [-1];
	for(let innerIndex in words){
	    if("answer" in words[innerIndex] && !("startx" in words[innerIndex])){
		var temp = attemptToInsert(rows, cols, table, weights, verticalCount, totalCount, words[innerIndex].answer, innerIndex);
		if(temp[0] > best[0]){
		    best = temp;
		}
	    }
	}
	
	if(best[0] == -1){
            break;
        }
	else{
	    addWord(best, words, table);
	    if(best[5] == 1){
		verticalCount += 1;
	    }
	    totalCount += 1;
	}
    }

    for(let index in words){
        if(!("startx" in words[index])){
            words[index].orientation = "none";
        }
    }
    
    return {"table": table, "result": words};
}

function removeIsolatedWords(data){
    var oldTable = data.table;
    var words = data.result;
    var rows = oldTable.length;
    var cols = oldTable[0].length;
    var newTable = initTable(rows, cols);

    // Draw intersections as "X"'s
    for(let wordIndex in words){
        var word = words[wordIndex];
        if(word.orientation == "across"){
            var i = word.starty - 1;
            var j = word.startx - 1;
            for(let k = 0; k < word.answer.length; k++){
                if(newTable[i][j + k] == "0"){
                    newTable[i][j + k] = "O";
                }
                else if(newTable[i][j + k] == "O"){
                    newTable[i][j + k] = "X";
                }
            }
        }
        else if(word.orientation == "down"){
            var i = word.starty - 1;
            var j = word.startx - 1;
            for(let k = 0; k < word.answer.length; k++){
                if(newTable[i + k][j] == "0"){
                    newTable[i + k][j] = "O";
                }
                else if(newTable[i + k][j] == "O"){
                    newTable[i + k][j] = "X";
                }
            }
        }
    }

    // Set orientations to "none" if they have no intersections
    for(let wordIndex in words){
        var word = words[wordIndex];
        var isIsolated = true;
        if(word.orientation == "across"){
            var i = word.starty - 1;
            var j = word.startx - 1;
            for(let k = 0; k < word.answer.length; k++){
                if(newTable[i][j + k] == "X"){
                    isIsolated = false;
                    break;
                }
            }
        }
        else if(word.orientation == "down"){
            var i = word.starty - 1;
            var j = word.startx - 1;
            for(let k = 0; k < word.answer.length; k++){
                if(newTable[i + k][j] == "X"){
                    isIsolated = false;
                    break;
                }
            }
        }
        if(word.orientation != "none" && isIsolated){
            delete words[wordIndex].startx;
            delete words[wordIndex].starty;
            delete words[wordIndex].position;
            words[wordIndex].orientation = "none";
        }
    }

    // Draw new table
    newTable = initTable(rows, cols);
    for(let wordIndex in words){
        var word = words[wordIndex];
        if(word.orientation == "across"){
            var i = word.starty - 1;
            var j = word.startx - 1;
            for(let k = 0; k < word.answer.length; k++){
                newTable[i][j + k] = word.answer.charAt(k);
            }
        }
        else if(word.orientation == "down"){
            var i = word.starty - 1;
            var j = word.startx - 1;
            for(let k = 0; k < word.answer.length; k++){
                newTable[i + k][j] = word.answer.charAt(k);
            }
        }
    }

    return {"table": newTable, "result": words};
}

function trimTable(data){
    var table = data.table;
    var rows = table.length;
    var cols = table[0].length;

    var leftMost = cols;
    var topMost = rows;
    var rightMost = -1;
    var bottomMost = -1;
    
    for(let i = 0; i < rows; i++){
	for(let j = 0; j < cols; j++){
	    if(table[i][j] != "0"){
		var x = j;
		var y = i;
		
		if(x < leftMost){
		    leftMost = x;
		}
		if(x > rightMost){
		    rightMost = x;
		}
		if(y < topMost){
		    topMost = y;
		}
		if(y > bottomMost){
		    bottomMost = y;
		}
	    }	
	}
    }
    
    var trimmedTable = initTable(bottomMost - topMost + 1, rightMost - leftMost + 1);
    for(let i = topMost; i < bottomMost + 1; i++){
	for(let j = leftMost; j < rightMost + 1; j++){
	    trimmedTable[i - topMost][j - leftMost] = table[i][j];
	}
    }
    
    var words = data.result;
    for(let entry in words){
        if("startx" in words[entry]) {
	    words[entry].startx -= leftMost;
	    words[entry].starty -= topMost;
        }
    }
    
    return {"table": trimmedTable, "result": words, "rows": Math.max(bottomMost - topMost + 1, 0), "cols": Math.max(rightMost - leftMost + 1, 0)};
}

function tableToString(table, delim){
    var rows = table.length;
    if(rows >= 1){
        var cols = table[0].length;
        var output = "";
        for(let i = 0; i < rows; i++){
	    for(let j = 0; j < cols; j++){
	        output += table[i][j];
	    }
	    output += delim;
        }
        return output;
    }
    else{
        return "";
    }
}

function generateSimpleTable(words){
    var rows = computeDimension(words, 3);
    var cols = rows;
    var blankTable = initTable(rows, cols);
    var table = generateTable(blankTable, rows, cols, words, [0.7, 0.15, 0.1, 0.05]);
    var newTable = removeIsolatedWords(table);
    var finalTable = trimTable(newTable);
    assignPositions(finalTable.result);
    return finalTable;
}

function generateLayout(words_json){
    var layout = generateSimpleTable(words_json);
    layout.table_string = tableToString(layout.table, "<br>");
    return layout;
}

// ############################################################################################################################
// My code starts from here  ##################################################################################################
// ############################################################################################################################

const wordMeanings = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Word meanings").getDataRange().getValues();
const mySheet = SpreadsheetApp.getActiveSpreadsheet();
const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const urls = [
  '',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKBAMAAAB/HNKOAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAACFQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbdFIwQAAAAt0Uk5TAEAw4NDAkM/vv2BrEcTvAAAAGklEQVR4nGNggAIhEMHsCmaL4iPZKmZBtQAAJNQB3OM3Ax8AAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKBAMAAAB/HNKOAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAC1QTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwaAoPgAAAA90Uk5TADBvTxBAwICQ0N8goP+/e1bGuQAAACpJREFUeJxjYIAARmUHIBlWMQXMSwURLKtBJE8BiDwDZh4AkbHvHkL1AACzLwcb/83AwwAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAADZQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAt3ZocgAAABJ0Uk5TAEBvTxCggJDgILBf0MBwML/PRxraKQAAADVJREFUeJxjYEABjEzMLFAmKxs7BydcgosRpoKbB6aCjZ2XBa6AnQ3OZOUDU/wcAoJwBRAaACcEAOASRWIkAAAAAElFTkSuQmCC',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAADNQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAowVGyQAAABF0Uk5TACAwEODAsHBQgEDQr3+f32Ai4qVeAAAANElEQVR4nGNgQAOMTDAWMwsrjMnGDmNycHJBmczczDAmJw8vH78ARDsXFzs33AguuAkQAAApRADpgSK/vgAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKBAMAAAB/HNKOAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAACdQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3RL5tQAAAA10Uk5TAEA//4C/UDDgwN+QIFuxfC4AAAAtSURBVHicY2CAAEYlBSDJ7OIAIsEizKEJQJKdvR3McwGT04C4ImoDiHmAgQEAaRwFNy8S/rwAAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAD9QTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsyWCLwAAABV0Uk5TACBfTxBQ0IAw4ECfv4//sHDvwJBgQoBVHwAAADpJREFUeJxjYEAFjEzMLBAWKxs7OweEyckCk+Zi4+bhhTL5WBn4BSBMQSAWgqsVEIYwRdh42OA6wQwAOoYBRJuBenMAAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKBAMAAAB/HNKOAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAACdQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3RL5tQAAAA10Uk5TABA/IIDgYPBwoNAw77j9XIwAAAAqSURBVHicY2CAACElZSBp4hIG4jAWgEiOCSCSawOI3AVWNAMseRCqhQEAi04E/ZfZ+2sAAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAD9QTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsyWCLwAAABV0Uk5TAFBfINCQcPAw4IBvT8CgsBBAYM+/WawtoQAAAEBJREFUeJxjYEAFjEzMUBYLKxs7B5jFzMnAwMUFFeXm4YWqYOVj5RcAswRZGBiEWCFMYaBaVqgCFhFOmGkMYJUAOLkBP/VHZXAAAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAADNQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAowVGyQAAABF0Uk5TABBP0JCAwEBg8F/goHDfIL9nzniYAAAAOElEQVR4nGNgQAGMTEyMUCYzCysbhMUOpFk4EExWiFJOLiZuHqg2Vl6oKIjDxw81QYCPAyYIEQIAJ04A5zKrBIsAAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAKCAMAAABlokWQAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAADxQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0C8mMAAAABR0Uk5TAEAwIF/g0MCAULDw/xCgYJDP77/G/SaVAAAASUlEQVR4nGNgwAoYmUAkMwsTTICVjR0kzMbBxglXAxLh4mRgYkMR4QZiHhQRHgwRVl50ET5+Bk4uqICAoJAwPwMvuzAr3HoUAABndwGAnBmCtwAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAKBAMAAACgUqiRAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAACpQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAChPOiAAAAA50Uk5TAEAwPxDg0MBwkM/vv2AXHQ+FAAAAKUlEQVR4nGNgQAJCDAzKDiAGazoDR6kAWEycgYGdJBbn6rO8p1ciGwsAxckFVy0dkO4AAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAKCAMAAABlokWQAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAADlQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvHZQPQAAABN0Uk5TAEAwEE9fIODQwKCA8GCQUM/vv7ubtzwAAABFSURBVHicY2DAChiZgAQzCysbTICdgxNIcnFz8zDC1XBCaF4udBE+bjQRXg5mVBEkAYgIP5IAn4CgEC8Dj4CQEB9WxwEAdu4BowICC5kAAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAKCAMAAABlokWQAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAADlQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvHZQPQAAABN0Uk5TAEAwIE9v4NDAgHA/v1AQkM/vYKT44WYAAABKSURBVHicY2DAChiZgAQzCysTTICNnQNIcnJysnPB1XCg0jAWMzcPL6oIIycHL7ouZjYUET4kc/gFBHmEGNh5eNjg1kMAHx+YAgBq0AGAR713YgAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAKCAMAAABlokWQAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAADlQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvHZQPQAAABN0Uk5TAEAwED/g0MCwUICQ338gz++/YARniS4AAABISURBVHicbcvbDoAwCANQurqhbnj7/481YszE2JeSkyLyGyQvDg/kot5j7huXadYoVH6kQqKkZtZseQkBFPCGum77cR39K+QEW74BRhyMzPAAAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAKCAMAAABlokWQAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAADlQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvHZQPQAAABN0Uk5TAEAwID8Q4NDAgKDPv3+QcLDvYDv9AC4AAABNSURBVHicbY1RDoAgDEOHW8XBRPT+h5UAQUjsR7e8dB3Rr9xWjEUEHez+KK5BlUemEjdfVRLtxEIYCGkh0/y2K3eQ4m0PZTM/fjWh9b5z+QGP6PW+NAAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAKCAMAAABlokWQAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAD9QTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsyWCLwAAABV0Uk5TAEAwEE9vIODQwJCAUKBgv6//8M/vbQlwWQAAAFFJREFUeJxtzkkOgDAIBVBqFYEOON3/rJamMSWRxV+8fAgAvxMWy7huOGAnboksKX8dk1LnLRNKeqCTs0AmJxyaOpEKeA2Q+9EKkZTm4/2hni+PYQHhumrH0gAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAKCAMAAABlokWQAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAADZQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAt3ZocgAAABJ0Uk5TAEAwP+DQwGCAsBDwcJDP77+gUqfTDAAAAERJREFUeJxjYMAKGJmABBMzMzMTVICFlQ1IsnNwcHLC1bBBaE52NBEubgY0ER5edBEWJjQRRla4AC8fvwDQTEG4uWgAAFW1AQ93k/EyAAAAAElFTkSuQmCC','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAKCAMAAABlokWQAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAEJQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAjuH28gAAABZ0Uk5TAEAwb+DQwIBwsJBgoD+fIBDw/8/vvx+pdcAAAABPSURBVHicbcvJDoAwCEVRikAHHOrQ//9VralNiH2LuzgBgOEc1uKEHxDLU88hpn5TRRygGNF5WYMRJz6qEdog7z85GqTzKgpKhftXW357A3hyAc06g4p6AAAAAElFTkSuQmCC',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAKCAMAAABlokWQAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAEVQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3Orq9wAAABd0Uk5TAEAwXyDg0MCAsHBQ8BD/kJ8/YM/vv6CL5tTCAAAAT0lEQVR4nGNgwAoYmUAkEzMLTICVjR1IcnBysXPD1YBEeHgZGDlRRPiAInwoIvwCguyoIgxCHEysqCJAwzmgAvzCIqJCDByiwmK8qK6CcgGHqwH0UWLRGQAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAKCAMAAABlokWQAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAD9QTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsyWCLwAAABV0Uk5TADBvTxAgX0DAgJDQULDf8P+g4GC/cdqRLgAAAFRJREFUeJxtzdEOgCAIBdBLYWpoifH/35orpy/eB+44YwNYhbadW7mDOvgQT2F4iZLmWfDICSQD+HK4W5chGv9tiGoblad8AH2Qcv9VzIzAwSphlRexvQJM7FSSDwAAAABJRU5ErkJggg=='];
const sheetsList = mySheet.getSheets();
const lastSheetNum = parseInt(sheetsList[sheetsList.length-4].getSheetName().match(/[0-9]+/)[0]);
let layout, table, jsonResult, acrossNum, wordsList, clues;

const getNewList = () => {

  let newPuzzleList = [];
  wordsList = [];
  clues = [];

  
  for (let i = 0; i < wordMeanings.length; i++) {
    wordsList.push(wordMeanings[i][0]);
  }

  while (newPuzzleList.length < 15) {
    const random = Math.floor(Math.random() * (wordsList.length - 6));
    if (!newPuzzleList.includes(wordsList[random])) {
      newPuzzleList.push(wordsList[random]);
      clues.push(wordMeanings[random][1]);
    }
  }

  for (let i = wordsList.length - 5; i < wordsList.length; i++) {
    newPuzzleList.push(wordsList[i]);
    clues.push(wordMeanings[i][1]);
  }

  return newPuzzleList;

};

const makePuzzle = () => {

  const newList = getNewList();

  const json = newList.reduce((list, word, i) => list.concat({"clue": clues[i], "answer": word}), []);

  layout = generateLayout(json);
  table = layout.table;
  jsonResult = layout.result;


};

const checkPuzzle = () => {

  while (jsonResult.some(r => r.orientation == 'none') || layout.cols >= 26) {
    makePuzzle();
  }

};

const makeFinalPuzzle = () => {
  makePuzzle();
  checkPuzzle();
};

const setNewSheet = answer => {
  let newSheetName;
  acrossNum = jsonResult.map(o => o.orientation).reduce((sum, item) => item == 'across' ? sum + 1 : sum + 0, 0);

  if (answer) {
    newSheetName = "CR " + (lastSheetNum + 1) + " (ANS)";
    mySheet.insertSheet(newSheetName, sheetsList.length-2);
  } else {
    newSheetName = "CR " + (lastSheetNum + 1);
    mySheet.insertSheet(newSheetName, sheetsList.length-3);
  }

  // add sheet then change width and height of first cell
  mySheet.setRowHeight(1, 11);
  mySheet.setColumnWidth(1, 11);
  
  // change width and height of all the cells that contains data
  for (let i = 2; i <= layout.rows+23; i++) {
    mySheet.setRowHeight(i, 50);
  }
  for (let i = 2; i <= layout.cols+1; i++) {
    mySheet.setColumnWidth(i, 50);
  }

  // format cells: background, font size, font weight, alignment
  mySheet.getRange('B2:' + alpha[layout.cols] + (layout.rows+1)).setBackground('black').setFontSize(20).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  mySheet.getRange('B' + (layout.rows+2) + ':G' + (layout.rows+23)).setFontSize(20).setHorizontalAlignment('center').setVerticalAlignment('middle');
  mySheet.getRange('B' + (layout.rows+2) + ':' + alpha[layout.cols] + (layout.rows+2)).setFontWeight('bold');
  mySheet.getRange('B' + (layout.rows+acrossNum+3) + ':' + alpha[layout.cols] + (layout.rows+acrossNum+3)).setFontWeight('bold');
  mySheet.getRange('B' + (layout.rows+3) + ':B' + (layout.rows+acrossNum+2)).setHorizontalAlignment('left');
  mySheet.getRange('B' + (layout.rows+acrossNum+4) + ':B' + (layout.rows+23)).setHorizontalAlignment('left');

};

const addData = answer => {
  const acrossClues = jsonResult.map(c => c.clue).filter((c,i) => jsonResult[i].orientation == 'across' ? true : false);
  const downClues = jsonResult.map(c => c.clue).filter((c,i) => jsonResult[i].orientation == 'down' ? true : false);
  const acrossPosition = jsonResult.map(p => p.position).filter((p,i) => jsonResult[i].orientation == 'across' ? true : false);
  const downPosition = jsonResult.map(p => p.position).filter((p,i) => jsonResult[i].orientation == 'down' ? true : false);
  const positions = [];

  // add letters while changing background to white and adding border
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      if (table[r][c] != "0") {
        mySheet.getRange(alpha[c+1] + (r+2)).setBackground('white').setBorder(true,true,true,true,false,false);
        if (answer) {
          mySheet.getRange(alpha[c+1] + (r+2)).setValue(table[r][c].toUpperCase());
        }
      }
    }
  }

  // add ACROSS and DOWN
  for (let i = 0; i < 'ACROSS'.length; i++) {
    mySheet.getRange(alpha[i+1] + (layout.rows+2)).setValue('ACROSS'[i]);
  }
  for (let i = 0; i < 'DOWN'.length; i++) {
    mySheet.getRange(alpha[i+1] + (layout.rows+acrossNum+3)).setValue('DOWN'[i]);
  }

  // add across and down clues
  for (let i = 0; i < acrossClues.length; i++) {
    mySheet.getRange('B' + (layout.rows+3+i)).setValue(acrossPosition[i] + '. ' + acrossClues[i]);
  }
  for (let i = 0; i < downClues.length; i++) {
    mySheet.getRange('B' + (layout.rows+acrossNum+4+i)).setValue(downPosition[i] + '. ' + downClues[i]);
  }

  // add position numbers
  for (let i = 0; i < jsonResult.length; i++) {
    if (!positions.includes(jsonResult[i].position)) {
      if (jsonResult[i].position >= 10) {
        mySheet.insertImage(urls[jsonResult[i].position], jsonResult[i].startx+1, jsonResult[i].starty+1, 2, 2).setWidth(17).setHeight(10);
      } else {
        mySheet.insertImage(urls[jsonResult[i].position], jsonResult[i].startx+1, jsonResult[i].starty+1, 2, 2).setWidth(10).setHeight(10);
      }
      positions.push(jsonResult[i].position);
    }
  }

};

function generateCrosswordPuzzle() {
  makeFinalPuzzle();
  setNewSheet(false);
  addData(false);
  setNewSheet(true);
  addData(true);
};

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

function AssetManager() {
    this.successCount = 0;
    this.errorCount = 0;
    this.cache = [];
    this.downloadQueue = [];
}

AssetManager.prototype.queueDownload = function (path) {
    console.log(path.toString());
    this.downloadQueue.push(path);
}

AssetManager.prototype.isDone = function () {
    return (this.downloadQueue.length == this.successCount + this.errorCount);
}
AssetManager.prototype.downloadAll = function (callback) {
    for (var i = 0; i < this.downloadQueue.length; i++) {
        var path = this.downloadQueue[i];
        var img = new Image();
        var that = this;
        img.addEventListener("load", function () {
            console.log("dun: " + this.src.toString());
            that.successCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.addEventListener("error", function () {
            that.errorCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.src = path;
        this.cache[path] = img;
    }
}

AssetManager.prototype.getAsset = function(path){
    //console.log(path.toString());
    return this.cache[path];
}


function GameEngine() {
    this.entities = [];
    this.ctx = null;
    this.click = null;
    this.mouse = null;
    this.wheel = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
}

GameEngine.prototype.init = function (ctx) {
    this.ctx = ctx;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();

    console.log('game initialized');
}

GameEngine.prototype.start = function () {
    console.log("starting game");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

GameEngine.prototype.startInput = function () {
    console.log('Starting input');

    var getXandY = function (e) {
        var x = e.clientX - that.ctx.canvas.getBoundingClientRect().left;
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top;

        if (x < 1024) {
            x = Math.floor(x / 32);
            y = Math.floor(y / 32);
        }

        return { x: x, y: y };
    }

    var that = this;

    this.ctx.canvas.addEventListener("click", function (e) {
        that.click = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousemove", function (e) {
        that.mouse = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousewheel", function (e) {
        that.wheel = e;
    }, false);

    console.log('Input started');
}

GameEngine.prototype.addEntity = function (entity) {
    console.log('added entity');
    this.entities.push(entity);
}

GameEngine.prototype.draw = function (drawCallback) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    if (drawCallback) {
        drawCallback(this);
    }
    this.ctx.restore();
}

GameEngine.prototype.update = function () {
    var entitiesCount = this.entities.length;

    for (var i = 0; i < entitiesCount; i++) {
        var entity = this.entities[i];

        if (!entity.removeFromWorld) {
            entity.update();
        }
    }

    for (var i = this.entities.length - 1; i >= 0; --i) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        }
    }
}

GameEngine.prototype.loop = function () {
    this.update();
    this.draw();
    this.click = null;
    this.wheel = null;
}

function Entity(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
}

Entity.prototype.update = function () {
}

Entity.prototype.draw = function (ctx) {
    if (this.game.showOutlines && this.radius) {
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.stroke();
        ctx.closePath();
    }
}

Entity.prototype.rotateAndCache = function (image, angle) {
    var offscreenCanvas = document.createElement('canvas');
    var size = Math.max(image.width, image.height);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.save();
    offscreenCtx.translate(size / 2, size / 2);
    offscreenCtx.rotate(angle);
    offscreenCtx.translate(0, 0);
    offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
    offscreenCtx.restore();
    //offscreenCtx.strokeStyle = "red";
    //offscreenCtx.strokeRect(0,0,size,size);
    return offscreenCanvas;
}

// Fisher and Nutters code here
// Fisher and Nutters Animation code below

function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    pom.click();
}

function Renderer(poplst) {
    this.pops = poplst;
    this.maxs = [];
    this.gmaxs = [];
    this.run = 0;
    this.batch = Math.floor(Math.random() * 100);
    for (var i = 0; i < this.pops.length; i++) {
        this.maxs.push([]);
        this.maxs[i].push(0);
        this.gmaxs.push([]);
        this.gmaxs[i].push(0);
    }

    Entity.call(this, null, 0, 0);
}

Renderer.prototype = new Entity();
Renderer.prototype.constructor = Renderer;

Renderer.prototype.update = function () {
    var str = "";
    for (var i = 0; i < this.pops.length; i++) {
        this.pops[i].day();
    }
    if (this.pops[0].days === 50000) {
        for (var i = 0; i < this.pops.length; i++) {
            for (var j = 0; j < this.maxs[i].length; j++) {
                str += this.maxs[i][j] + "\n";
            }
        }
        for (var i = 0; i < this.pops.length; i++) {
            for (var j = 0; j < this.maxs[i].length; j++) {
                str += this.gmaxs[i][j] + "\n";
            }
        }
        for (var i = 0; i < this.pops.length; i++) {
                this.pops[i] = new Population(this.pops[i].params);
                this.maxs[i] = [];
                this.gmaxs[i] = [];
        }
        download("b" + this.batch + "r" + this.run++ + ".txt", str);
        str = "";
    }
    Entity.prototype.update.call(this);
}

Renderer.prototype.drawGeneplex = function (ctx, gp, x, y) {
    var offset = 0;
    //console.log(gp.genes[0].cost());
    for (var j = 0; j < gp.genes.length; j++) {
        ctx.beginPath();
        ctx.strokeStyle = gp.genes[j].reward() === 3 ? "red" : gp.genes[j].reward() === 2 ? "blue" : "grey";
        ctx.rect(x + offset, y, 3 * gp.genes[j].cost(), 3);
        //console.log("Gene " + j + " Cost " + gp.genes[j].cost() + " Game " + gp.genes[j].minigame.perm.perm + " Attempt " + gp.genes[j].perm.perm);
        ctx.stroke();
        offset += 3 * gp.genes[j].cost();
    }
}

Renderer.prototype.drawGenome = function (ctx, genome, x, y) {

    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.rect(x, y, 1, 1 * genome.params.lengthmax);
    ctx.stroke();

    for (var i = 0; i < genome.geneplexes.length; i++) {
        var gp = genome.geneplexes[i];
        var offset = 0;

        ctx.beginPath();
        ctx.strokeStyle = "blue";
        ctx.rect(x + 4 + i * 3, y, 1, 1 * gp.fitness());
        ctx.stroke();

        //for (var j = 0; j < gp.genes.length; j++) {
        //    ctx.beginPath();
        //    ctx.strokeStyle = gp.genes[j].reward() === 3 ? "yellow" : gp.genes[j].reward() === 2 ? "lightblue" : "grey";
        //    ctx.rect(x + 10 + i * 13, y + offset, 2, 1 * gp.genes[j].cost());
        //    //console.log("Gene " + j + " Cost " + gp.genes[j].cost() + " Game " + gp.genes[j].minigame.perm.perm + " Attempt " + gp.genes[j].perm.perm);
        //    ctx.stroke();
        //    offset += 1 * gp.genes[j].cost();
        //}
    }
    genome.minmax(1);
}

Renderer.prototype.drawAgent = function (ctx, agent, x, y) {

    ctx.beginPath();
    ctx.strokeStyle = "purple";
    ctx.rect(x - 3, y, 1, 1 * agent.fitness / (agent.age > 0 ? agent.age : 1));
    ctx.stroke();

    this.drawGenome(ctx, agent.memome, x, y);
    this.drawGenome(ctx, agent.genome, x, y);
    this.drawGeneplex(ctx, agent.genome.mins[0], x, y + 52)
    this.drawGeneplex(ctx, agent.genome.maxs[0], x, y + 56);
    this.drawGeneplex(ctx, agent.memome.mins[0], x, y + 60)
    this.drawGeneplex(ctx, agent.memome.maxs[0], x, y + 64);
}

Renderer.prototype.drawPop = function(ctx, pop,index, x, y) {
    var ages = 0;
    var min = pop.params.lengthmax + 1;
    var max = 0;
    var gmin = pop.params.lengthmax + 1;
    var gmax = 0;

    // draw genome
    //console.log(pop.agents[0].genome.mins[0].fitness());
    for (var i = 0; i < pop.agents.length; i++) {
        ctx.beginPath();
        ctx.strokeStyle = index === 0 ? "red" : index === 1 ? "blue" : index === 2 ? "orange" : "purple";
        ctx.rect(x + i * 3, y, 1, 1 * (pop.agents[i].age == 0 ? 0 : pop.agents[i].fitness / pop.agents[i].age));
        ctx.stroke();

        ages += pop.agents[i].age;
        gmin = pop.agents[i].genome.mins[0].fitness() < min ? pop.agents[i].genome.mins[0].fitness() : gmin;
        gmax = pop.agents[i].genome.mins[0].fitness() > max ? pop.agents[i].genome.maxs[0].fitness() : gmax;
        min = pop.agents[i].memome.mins[0].fitness() < min ? pop.agents[i].memome.mins[0].fitness() : min;
        max = pop.agents[i].memome.mins[0].fitness() > max ? pop.agents[i].memome.maxs[0].fitness() : max;

        if (i < Math.floor(938 / 70)) this.drawAgent(ctx, pop.agents[i], x, y + 52 + 70 * i);
    }

    if (pop.days % 20 == 0) {
        this.maxs[index].push(max);
        this.gmaxs[index].push(gmax);
    }
    //ctx.font = "18px Arial";
    //ctx.fillStyle = "black";
    //ctx.fillText("Day " + pop.days, 610, 150);
    //ctx.fillText("Gene Min " + gmin, 610, 170);
    //ctx.fillText("Gene Max " + gmax, 610, 190);
    //ctx.fillText("Meme Min " + min, 610, 210);
    //ctx.fillText("Meme Max " + max, 610, 230);
    //ctx.fillText("Avg Age " + ages / pop.agents.length, 610, 250);
    //ctx.fillText("Death Age " + pop.deathage / pop.deaths, 610, 270);
}

Renderer.prototype.draw = function (ctx) {
    var that = this;
    var gap = 160;

    ctx.font = "18px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("Biological", 10, 25);
    ctx.fillText("Learners", 10 + gap, 25);
    ctx.fillText("Socializers", 10 + 2 * gap, 25);
    ctx.fillText("Immortal", 10 + 3 * gap, 25);
    ctx.fillText("Day " + this.pops[0].days, 10 + 4 * gap, 25);

    for (var i = 0; i < this.pops.length; i++) {
        this.drawPop(ctx, this.pops[i], i, 10 + gap * i, 35);
    }

    for (var i = 0; i < this.maxs.length; i++) {
        var m = this.maxs[i];
        var g = this.gmaxs[i];
        ctx.beginPath();
        ctx.strokeStyle = i === 0 ? "red" : i === 1 ? "blue" : i === 2 ? "orange" : "purple";
        ctx.moveTo(10 + 4 * gap, 535);
        var px = 0;
        for (var j = 0; j < m.length; j++) {
            if (m.length > 500 && j % Math.ceil(m.length / 500) != 0) continue;
            ctx.lineTo(10 + 4 * gap + ++px, 535 - m[j] * 10);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = i === 0 ? "red" : i === 1 ? "blue" : i === 2 ? "orange" : "purple";
        ctx.moveTo(10 + 4 * gap, 990);
        var px = 0;
        for (var j = 0; j < g.length; j++) {
            if (g.length > 500 && j % Math.ceil(g.length / 500) != 0) continue;
            ctx.lineTo(10 + 4 * gap + ++px, 990 - g[j] * 9);
        }
        ctx.stroke();
    }
}

// Fisher and Nutters simulation code below

var contains = function (lst, obj) {
    for (var i =0; lst != null && i < lst.length; i++){
        if(lst[i] === obj)
            return true;
    }
    return false;
}

var swap = function (list, i, j) {
    var temp = list[i];
    list[i] = list[j];
    list[j] = temp;
}


var Perm = function (size) {
    this.perm = [];
    this.size = size;
    var list = [];

    for (var i = 0; i < this.size; i++) {
        list.push(i);
    }
    
    for (var i = 0; i < this.size; i++) {
        var index = Math.floor(Math.random() * list.length);
        this.perm.push(list[index]);
        list.splice(index, 1);
    }
}

Perm.prototype.compare = function (other) {
    var count = 0;
    var score = 0;
    //console.log(this.perm + " ");
    //console.log(other.perm);
    while (count < this.perm.length) {
        if(contains(this.perm, other.perm[score]))
            count++;
        score++;
     }
    return score;
}

Perm.prototype.mutate = function () {
    if (this.perm.length === 1) return;
    var i = Math.floor(Math.random() * this.perm.length);
    var j = i;
    while (j === i) {
        j = Math.floor(Math.random() * this.perm.length);
    }

    swap(this.perm, i, j);
}

Perm.prototype.clone = function () {
    var np = new Perm(this.perm.length);
    for (var i = 0; i < this.perm.length; i++) {
        np.perm[i] = this.perm[i];
    }
    return np;
}

var Minigame = function (size, reward, type) {
    this.perm = new Perm(size);
    this.perm.perm = this.perm.perm.splice(0, reward);
    //console.log(this.perm.perm);
    this.reward = reward;
    this.type = type;
}

Minigame.prototype.play = function (perm) {
    return this.perm.compare(perm);
}

Minigame.prototype.mutate = function () {
    var i = Math.floor(Math.random()*this.reward);
    var j = Math.floor(Math.random()*this.reward);

    swap(this.perm.perm, i, j);
}

Minigame.prototype.clone = function () {
    var nm = new Minigame(this.reward, this.reward, this.type);
    nm.perm = this.perm.clone();
    return nm;
}

var Gene = function (minigame, perm) {
    this.minigame = minigame;
    this.perm = perm;
}

Gene.prototype.cost = function () {
    return this.minigame.play(this.perm);
}

Gene.prototype.reward = function () {
    return this.minigame.reward;
}

Gene.prototype.mutate = function () {
    this.perm.mutate();
}

Gene.prototype.clone = function () {
    return new Gene(this.minigame.clone(), this.perm.clone());
}

var Geneplex = function (params) {
    this.params = params;
    this.genes = [];
    var reward = Math.floor(Math.random() * this.params.rewardmax + 1);
    this.genes.push(new Gene(new Minigame(this.params.permsize, reward, reward == 1 ? "FISH" : "NUTS"), new Perm(this.params.permsize)));
}

Geneplex.prototype.mutate = function (){
    if(Math.random()>0.5){
        // mutate a random gene in the list
        var index = Math.floor(Math.random()*this.genes.length);
        this.genes[index].mutate();
        if(this.length() > this.params.lengthmax){
            this.genes.splice(index,1);
        }
    }
    else {
        // grow a new gene
        var reward = Math.floor(Math.random() * this.params.rewardmax + 1)
        this.genes.push(new Gene(new Minigame(this.params.permsize, reward, reward == 1 ? "FISH" : "NUTS"), new Perm(this.params.permsize)));
        while (this.length() > this.params.lengthmax) {
            this.genes.pop();
        }
    }
}

Geneplex.prototype.clone = function () {
    var gp = new Geneplex(this.params);
    gp.genes = [];
    for (var i = 0; i < this.genes.length; i++) {
        gp.genes.push(this.genes[i].clone());
    }
    return gp;
}

Geneplex.prototype.length = function () {
    var length = 0;
    for (var i = 0; i < this.genes.length; i++) {
        length += this.genes[i].cost();
    }
    return length;
}

Geneplex.prototype.fitness = function () {
    var fitness = 0;
    for (var i = 0; i < this.genes.length; i++) {
        fitness += this.genes[i].reward();
    }
    return fitness;
}

var Genome = function (params) {
    this.params = params;
    this.geneplexes = [];
    this.generation = 0;

    this.mins = [];
    this.maxs = [];

    for(var i = 0; i < this.params.genomesize; i++){
        this.geneplexes.push(new Geneplex(this.params));
    }
    this.minmax(1);
}

Genome.prototype.minmax = function (num) {
    this.mins = [];
    this.maxs = [];

    while (num > 0) {
        var index = 0;
        var maxdex = 0;
        var min = this.params.lengthmax+1;
        var max = 0

        for (var i = 0; i < this.geneplexes.length; i++) {
            if (contains(this.mins, this.geneplexes[i])) continue;
            if (this.geneplexes[i].fitness() < min) {
                min = this.geneplexes[i].fitness();
                index = i;
            }
        }
        for (var i = 0; i < this.geneplexes.length; i++) {
            if (contains(this.maxs, this.geneplexes[i])) continue;
            if (this.geneplexes[i].fitness() >= max) {
                max = this.geneplexes[i].fitness();
                maxdex = i;
            }
        }

        this.geneplexes[index].min = true;
        this.geneplexes[index].index = index;
        this.mins.push(this.geneplexes[index]);
        this.maxs.push(this.geneplexes[maxdex]);
        num--;
    }
}

Genome.prototype.mutate = function() {
    this.generation++;
    var rate = this.params.mutationrate;
    this.minmax(rate);
    while (rate > 0) {
        rate--;
        var index = Math.floor(Math.random() * this.geneplexes.length);
        var gp = this.geneplexes[index].clone();
        gp.mutate();
        //console.log("Mutating index " + index);

        this.geneplexes[this.mins[rate].index] = gp;
        //console.log("Replacing index " + index + " Min " + min);
    }
}

Genome.prototype.clone = function() {
    var g = new Genome(this.params);

    g.geneplexes = [];

    for (var i = 0; i < this.geneplexes.length; i++) {
        g.geneplexes.push(this.geneplexes[i].clone());
    }
    g.minmax(1);
    return g;
}

function Agent(params) {
    this.params = params;
    this.fitness = 0;
    this.age = 0;

    this.genome = new Genome(this.params);
    this.memome = this.genome.clone();
}

Agent.prototype.day = function () {
    this.age++;

    this.memome.minmax(1);
    // display random meme's phenotype
    //this.fitness += this.memome.geneplexes[Math.floor(Math.random()*this.memome.geneplexes.length)].fitness();
    // display max meme's phenotype
    this.fitness += this.memome.maxs[0].fitness();
    //console.log(this.memome);
    if (this.params.learning) this.memome.mutate();
}

Agent.prototype.mutate = function () {
    this.genome.mutate();
    this.memome = this.genome.clone();
    this.fitness = 0;
    this.age = 0;
}

Agent.prototype.clone = function () {
    var a = new Agent(this.params);
    a.genome = this.genome.clone();
    a.memome = a.genome.clone();
    return a;
}

function Population(params) {
    this.params = params;

    this.agents = [];
    this.days = 0;
    this.births = 0;
    this.deaths = 0;
    this.deathage = 0;

    this.mins = [];
    this.maxs = [];

    for (var i = 0; i < this.params.numagent; i++) {
        var a = new Agent(this.params);
        this.agents.push(a);
    }
}

Population.prototype.day = function () {
    this.days++;
    for (var i = 0; i < this.agents.length; i++) {
        this.agents[i].day();
    }
    this.mutate();
    if (this.days % 1 === 0) this.forum();
}

Population.prototype.minmax = function (num) {
    this.mins = [];
    this.maxs = [];
    
    while (num > 0) {
        var index = -1;
        var maxdex = -1;
        var min = this.params.lengthmax + 1;
        var max = 0;
        for (var i = 0; i < this.agents.length; i++) {
            if (contains(this.mins, this.agents[i])) continue;
            if (this.agents[i].fitness / this.agents[i].age - this.agents[i].age / 3 < min) {
                min = this.agents[i].fitness / this.agents[i].age - this.agents[i].age / 3;
                index = i;
            }
        }
        for (var i = 0; i < this.agents.length; i++) {
            if (contains(this.maxs, this.agents[i])) continue;
            if (this.agents[i].fitness / this.agents[i].age >= max) {
                max = this.agents[i].fitness / this.agents[i].age;
                maxdex = i;
            }
        }

        if (index != -1) {
            this.agents[index].index = index;
            this.mins.push(this.agents[index]);
        }
        if (maxdex != -1) {
            this.maxs.push(this.agents[maxdex]);
        }
        num--;
    }
}

Population.prototype.forum = function () {
    if (this.params.socialrate === 0) return;
    var agents = [];
    for (var i = 0; i < this.params.socialrate; i++) {
        var agent = this.agents[Math.floor(Math.random()*this.agents.length)];
        while (contains(agents, agent)) agent = this.agents[Math.floor(Math.random() * this.agents.length)];
        agents.push(agent);
    }
    var g = new Genome(this.params);
    g.geneplexes = [];
    for (var i = 0; i < agents.length; i++) {
        //console.log(this.agents[i].memome.maxs);
        agents[i].memome.minmax(this.params.mutationrate);
        for (var j = 0; j < this.params.mutationrate; j++) {
            // all contribute max memes
            var m = agents[i].memome.maxs[j].clone();
             //all contribute random memes
            //var x = Math.floor(Math.random() * agents[i].memome.geneplexes.length);
            //var m = agents[i].memome.geneplexes[x].clone();
            //console.log(m);
            g.geneplexes.push(m);
        }
    }
    g.minmax(this.params.mutationrate);
    for (var i = 0; i < agents.length; i++) {
        for (var j = 0; j < this.params.mutationrate; j++) {
            // get best memes back
            agents[i].memome.geneplexes[agents[i].memome.mins[j].index] = g.maxs[j].clone();
            // get random  memes back
            //var x = Math.floor(Math.random()*g.geneplexes.length);
            //agents[i].memome.geneplexes[agents[i].memome.mins[j].index] = g.geneplexes[x].clone();
        }
    }
}

Population.prototype.mutate = function () {
    if (this.params.generationtime == null) return;
    while (this.births < this.days / this.params.generationtime * this.agents.length) {
        var newbirths = this.agents.length * this.days / this.params.generationtime - this.births;
        this.minmax(newbirths);
        if (this.mins.length === 0) break;
        for (var i = 0; i < this.mins.length; i++) {
            var rindex = Math.floor(Math.random()*this.agents.length);
            var na = this.agents[rindex].clone();
            na.mutate();
            this.deathage += this.agents[this.mins[i].index].age;
            this.agents[this.mins[i].index] = na;
            this.deaths++;
            this.births++;
        }
    }
}

var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./img/FishSite.png");
ASSET_MANAGER.queueDownload("./img/NutSite.png");
ASSET_MANAGER.queueDownload("./img/Hut.png");
ASSET_MANAGER.queueDownload("./img/FishNutter.png");

ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var fnn = {};
    var p = [];

    fnn.numagent = 50;
    fnn.genomesize = 50;
    fnn.lengthmax = 50;
    fnn.mutationrate = 5;
    fnn.permsize = 5;
    fnn.rewardmax = 3;
    fnn.socialrate = 0;
    fnn.generationtime = 100;
    fnn.learning = false;
    p.push(new Population(fnn));

    fnn = {};
    fnn.numagent = 50;
    fnn.genomesize = 50;
    fnn.lengthmax = 50;
    fnn.mutationrate = 5;
    fnn.permsize = 5;
    fnn.rewardmax = 3;
    fnn.socialrate = 0;
    fnn.generationtime = 100;
    fnn.learning = true;
    p.push(new Population(fnn));

    fnn = {};
    fnn.numagent = 50;
    fnn.genomesize = 50;
    fnn.lengthmax = 50;
    fnn.mutationrate = 5;
    fnn.permsize = 5;
    fnn.rewardmax = 3;
    fnn.socialrate = 5;
    fnn.generationtime = 100;
    fnn.learning = true;
    p.push(new Population(fnn));

    //fnn = {};
    //fnn.numagent = 1;
    //fnn.genomesize = 50;
    //fnn.lengthmax = 50;
    //fnn.mutationrate = 5;
    //fnn.permsize = 5;
    //fnn.rewardmax = 3;
    //fnn.socialrate = 0;
    //fnn.generationtime = null;
    //fnn.learning = true;
    //p.push(new Population(fnn));

    var gameEngine = new GameEngine();
    var renderer = new Renderer(p);

    gameEngine.addEntity(renderer);
 
    //for (var i = 0; i < g.geneplexes.length; i++) {
    //    gp = g.geneplexes[i];
    //    for (var j = 0; j < gp.genes.length; j++) {
    //        console.log("Gene " + j);
    //        console.log(gp.genes[j].perm.perm);
    //        console.log(gp.genes[j].minigame.perm.perm);
    //        console.log(gp.genes[j].cost());
    //        console.log(gp.genes[j].reward());
    //    }
    //}

    gameEngine.init(ctx);
    gameEngine.start();
});

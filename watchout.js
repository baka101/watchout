// start slingin' some d3 here.

var gameOptions = {
  height: 450,
  width: 700,
  nEnemies: 30,
  padding: 20
};

var gameStats = {
  score: 0,
  bestScore: 0
};

var axes = {
  x: d3.scale.linear().domain([0,100]).range([0,gameOptions.width]),
  y: d3.scale.linear().domain([0,100]).range([0,gameOptions.height])
};

var gameBoard = d3.select('.container').append('svg:svg')
                .attr('width', gameOptions.width)
                .attr('height', gameOptions.height);

var updateScore = function () {
  d3.select('#current-score')
      .text(gameStats.score.toString());
};

var updateBestScore = function () {
  gameStats.bestScore = Math.max(gameStats.bestScore, gameStats.score);

  d3.select('#best-score').text(gameStats.bestScore.toString());
};

var Player = function (gameOptions) {
  this.path = 'm-7.5,1.62413c0,-5.04095 4.08318,-9.12413 9.12414,-9.12413c5.04096,0 9.70345,5.53145 11.87586,9.12413c-2.02759,2.72372 -6.8349,9.12415 -11.87586,9.12415c-5.04096,0 -9.12414,-4.08318 -9.12414,-9.12415z';
  this.fill = '#ff6600';
  this.x = 0;
  this.y = 0;
  this.angle = 0;
  this.r = 5;

  this.gameOptions = gameOptions;
};

Player.prototype.render = function (to) {
  this.el = to.append('svg:path')
          .attr('d', this.path)
          .attr('fill', this.fill);

  this.transform({
    x: this.gameOptions.width * 0.5,
    y: this.gameOptions.height * 0.5
  });

  this.setupDragging();

  return this;
};


Player.prototype.getX = function () {
  return this.x;
};


Player.prototype.setX = function (x) {
  minX = this.gameOptions.padding;
  maxX = this.gameOptions.width - this.gameOptions.padding;
  x = x >= minX ? x : minX;
  x = x <= maxX ? x : maxX;
  this.x = x;
};


Player.prototype.getY = function () {
  return this.y;
};

Player.prototype.setY = function (y) {
  minY = this.gameOptions.padding;
  maxY = this.gameOptions.height - this.gameOptions.padding;
  y = y >= minY ? y : minY;
  y = y <= maxY ? y : maxY;
  this.y = y;
};

Player.prototype.transform = function (opts) {
  this.angle = opts.angle || this.angle;
  this.setX(opts.x || this.x);
  this.setY(opts.y || this.y);

  this.el.attr('transform',
    'rotate(' + this.angle + ',' + this.getX() + ',' + this.getY() +') '+
    'translate(' + this.getX() +',' + this.getY() + ')');
};

Player.prototype.moveAbsolute = function(x,y) {
  this.transform({'x':x, 'y':y});
};


Player.prototype.moveRelative = function(dx,dy) {
  this.transform({
    x: this.getX()+dx,
    y: this.getY()+dy,
    angle: 360 * (Math.atan2(dy,dx)/(Math.PI*2))
  });
};

Player.prototype.setupDragging = function() {
  var context = this;

  var dragMove = function () {
    context.moveRelative(d3.event.dx, d3.event.dy);
  };

  var drag = d3.behavior.drag()
              .on('drag', dragMove);

  this.el.call(drag);

};

players = [];

var player1 = new Player(gameOptions);
player1.render(gameBoard);
//var player2 = new Player(gameOptions);
//player2.render(gameBoard);

players.push(player1);
//players.push(player2);

var play = function () {
  var gameTurn = function () {
    // newEnemyPositions = createEnemies();
    // render(newEnemyPositions);
  };

  var increaseScore = function () {
    gameStats.score += 1;
    updateScore();
  };

  gameTurn();
  setInterval(gameTurn, 2000);
  setInterval(increaseScore, 50);
}

play();

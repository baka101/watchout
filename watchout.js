// start slingin' some d3 here.

var gameOptions = {
  height: 450,
  width: 700,
  nEnemies: 2,
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

/////////////////////////////////////////////////////////////////////
// DEFINE PLAYER OBJECTS AND METHODS
////////////////////////////////////////////////////////////////////


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
///////////////////////////////////////////////////////////////////////
// CREATE ENEMIES AND ENEMY MOVEMENT
////////////////////////////////////////////////////////////////////
var createEnemies = function () {
  return _.range(0, gameOptions.nEnemies).map(function(i) {
    return {id : i,
      x: Math.random()*100,
      y: Math.random()*100};
  });
};

/////////////////////////////////////////////////////////////
// RENDERING GAMEBOARD
///////////////////////////////////////////////////////////////

var render = function (enemy_data) {
  var enemies = gameBoard.selectAll('circle.enemy')
                    .data(enemy_data, function(d) { return d.id; });

  enemies.enter().append('svg:circle')
            .attr('class', 'enemy')
            .attr('cx', function(enemy) { return axes.x(enemy.x); })
            .attr('cy', function(enemy) { return axes.y(enemy.y); })
            .attr('r', 0);

  enemies.exit().remove();

  var checkCollision =  function (enemy, collidedCallback) {
    _(players).each(function(player) {
      var radiusSum =  parseFloat(enemy.attr('r')) + player.r;
      var xDiff = parseFloat(enemy.attr('cx')) - player.x;
      var yDiff = parseFloat(enemy.attr('cy')) - player.y;

      var separation = Math.sqrt( Math.pow(xDiff,2) + Math.pow(yDiff,2) )
      if (separation < radiusSum) {
         collidedCallback(player, enemy);
      }
    });
  };

  var onCollision = function () {
    updateBestScore();
    gameStats.score = 0;
    updateScore();
  };

  var tweenWithCollisionDetection = function(endData) {

    var enemy = d3.select(this);

    var startPos = {
      x: parseFloat(enemy.attr('cx')),
      y: parseFloat(enemy.attr('cy'))
    };

    var endPos = {
      x: axes.x(endData.x),
      y: axes.y(endData.y)
    };

    return function (t) {
      checkCollision(enemy, onCollision);

      var enemyNextPos = {
        x: startPos.x + (endPos.x - startPos.x)*t,
        y: startPos.y + (endPos.y - startPos.y)*t
      };

      enemy.attr('cx', enemyNextPos.x)
            .attr('cy', enemyNextPos.y);
    };
  };

  enemies
    .transition()
      .duration(500)
      .attr('r', 10)
    .transition()
      .duration(2000)
      .tween('custom', tweenWithCollisionDetection);
};
/////////////////////////////////////////////////////
// CREATE PLAYERS AND INITIATE GAME
/////////////////////////////////////////////////////
players = [];

var player1 = new Player(gameOptions);
player1.render(gameBoard);
//var player2 = new Player(gameOptions);
//player2.render(gameBoard);

players.push(player1);
//players.push(player2);

var play = function () {
  var gameTurn = function () {
    newEnemyPositions = createEnemies();
    render(newEnemyPositions);
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

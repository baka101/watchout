// start slingin' some d3 here.

var gameOptions = {
  height: 450,
  width: 700,
  nEnemies: 30,
  padding: 20
};

var gameStats = {
  score: 0,
  bestScore: 0,
  collisions: 0
};

var axes = {
  x: d3.scale.linear().domain([0,100]).range([0,gameOptions.width]),
  y: d3.scale.linear().domain([0,100]).range([0,gameOptions.height])
};

var gameBoard = d3.select('.container').append('svg:svg')
                .attr('width', gameOptions.width)
                .attr('height', gameOptions.height);

var updateScore = function () {
  d3.select('.current')
      .text('Current Score: ' + gameStats.score.toString());
};

var updateBestScore = function () {
  gameStats.bestScore = Math.max(gameStats.bestScore, gameStats.score);

  d3.select('.high').text('Best Score:' + gameStats.bestScore.toString());
};

var updateCollisions = function () {
  d3.select('.collisions').text('Collisions:' + gameStats.collisions.toString());
}

/////////////////////////////////////////////////////////////////////
// DEFINE PLAYER OBJECTS AND METHODS
////////////////////////////////////////////////////////////////////


var Player = function (gameOptions) {
  //this.path = 'm-7.5,1.62413c0,-5.04095 4.08318,-9.12413 9.12414,-9.12413c5.04096,0 9.70345,5.53145 11.87586,9.12413c-2.02759,2.72372 -6.8349,9.12415 -11.87586,9.12415c-5.04096,0 -9.12414,-4.08318 -9.12414,-9.12415z';
  this.fill = '#ff6600';
  this.x = 0;
  this.y = 0;
  this.angle = 0;
  this.r = 5;

  this.gameOptions = gameOptions;
};

Player.prototype.render = function (to) {
  this.el = to.append('svg:image')
          .attr('class', 'player')
          .attr('xlink:href', 'img/smiley.png')
          .attr('width', '20')
          .attr('height', '20')
          //.attr('fill', this.fill);

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
    //'rotate(' + this.angle + ',' + this.getX() + ',' + this.getY() +') '+
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
    var obj = {id : i,
      x: Math.random()*100,
      y: Math.random()*100};

    return obj;
  });
};

/////////////////////////////////////////////////////////////
// RENDERING GAMEBOARD
///////////////////////////////////////////////////////////////

var render = function (enemy_data) {
  var enemies = gameBoard.selectAll('image.enemy')
                    .data(enemy_data, function(d) { return d.id; });

  enemies.enter().append('svg:image')
            .attr('class', 'enemy')
            .attr('xlink:href', 'img/poop.png')
            .attr('width', '20')
            .attr('height', '20')
            .attr('x', function(enemy) { return axes.x(enemy.x); })
            .attr('y', function(enemy) { return axes.y(enemy.y); })
            .attr('r', 0);

  // enemies.enter().append('svg:circle')
  //           .attr('class', 'enemy')
  //           .attr('cx', function(enemy) { return axes.x(enemy.x); })
  //           .attr('cy', function(enemy) { return axes.y(enemy.y); })
  //           .attr('r', 0);

  enemies.exit().remove();

  var checkCollision =  function (enemy, collidedCallback) {
    _(players).each(function(player) {
      var radiusSum =  parseFloat(enemy.attr('r')) + player.r;
      var xDiff = parseFloat(enemy.attr('x')) - player.x;
      var yDiff = parseFloat(enemy.attr('y')) - player.y;

      var separation = Math.sqrt( Math.pow(xDiff,2) + Math.pow(yDiff,2) )
      if (separation < radiusSum) {
         collidedCallback(player, enemy);
      }
    });
  };

  var onCollision = function () {
    updateBestScore();
    gameStats.score = 0;
    gameStats.collisions++;
    d3.select('.player').attr('xlink:href', 'img/sick.png');
    d3.timer(function () {
      d3.select('.player').attr('xlink:href', 'img/smiley.png');
      return true;
    }, 1000);
    updateCollisions();
    updateScore();
  };

  var tweenWithCollisionDetection = function(endData) {

    var enemy = d3.select(this);

    var startPos = {
      x: parseFloat(enemy.attr('x')),
      y: parseFloat(enemy.attr('y'))
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

      enemy.attr('x', enemyNextPos.x)
            .attr('y', enemyNextPos.y);
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
    var newEnemyPositions = createEnemies();
    render(newEnemyPositions);

    d3.timer(gameTurn, 2000);
    return true;
  };

  var increaseScore = function () {
    gameStats.score += 1;
    updateScore();
    d3.timer(increaseScore, 50);
    return true;
  };

  gameTurn();

  // var rotateEnemies = function () {

  //   var enemies = d3.selectAll('.enemy')
  //   enemies.attr('transform', 'rotate(' + 180 + ',' + enemx + ',' + y +')';
  //   });
  //   d3.timer(rotateEnemies, 500);
  //   return true;
  // }


  d3.timer(gameTurn, 2000);
  //setInterval(gameTurn, 2000);
  d3.timer(increaseScore, 50);
  //setInterval(increaseScore, 50);
  //d3.timer(rotateEnemies, 500);
}

play();

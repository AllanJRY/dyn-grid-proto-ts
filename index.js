// Définition des types d'édition.
// NOTE: EditType aurait été un meilleur non ?
var TransformType;
(function (TransformType) {
    TransformType[TransformType["NONE"] = 0] = "NONE";
    TransformType[TransformType["INSERT"] = 1] = "INSERT";
    TransformType[TransformType["MOVE"] = 2] = "MOVE";
    TransformType[TransformType["RESIZE"] = 3] = "RESIZE";
})(TransformType || (TransformType = {}));
// Définition des directions de redimensionnement.
var Direction;
(function (Direction) {
    Direction[Direction["NONE"] = 0] = "NONE";
    Direction[Direction["TOP"] = 1] = "TOP";
    Direction[Direction["TOP_RIGHT"] = 2] = "TOP_RIGHT";
    Direction[Direction["RIGHT"] = 3] = "RIGHT";
    Direction[Direction["BOTTOM_RIGHT"] = 4] = "BOTTOM_RIGHT";
    Direction[Direction["BOTTOM"] = 5] = "BOTTOM";
    Direction[Direction["BOTTOM_LEFT"] = 6] = "BOTTOM_LEFT";
    Direction[Direction["LEFT"] = 7] = "LEFT";
    Direction[Direction["TOP_LEFT"] = 8] = "TOP_LEFT";
})(Direction || (Direction = {}));
// Permet de retrouver un type d'énumération via sa valeur ordinal.
// Pourquoi ? Direction[ordinal] === Direction.X ne marche pas, VDM.
// NOTE: Les enums TS c'est de la merde.
function getDirectionFromOrdinal(ordinal) {
    if (ordinal === Direction.NONE.toString()) {
        return Direction.NONE;
    }
    if (ordinal === Direction.TOP.toString()) {
        return Direction.TOP;
    }
    if (ordinal === Direction.TOP_RIGHT.toString()) {
        return Direction.TOP_RIGHT;
    }
    if (ordinal === Direction.RIGHT.toString()) {
        return Direction.RIGHT;
    }
    if (ordinal === Direction.BOTTOM_RIGHT.toString()) {
        return Direction.BOTTOM_RIGHT;
    }
    if (ordinal === Direction.BOTTOM.toString()) {
        return Direction.BOTTOM;
    }
    if (ordinal === Direction.BOTTOM_LEFT.toString()) {
        return Direction.BOTTOM_LEFT;
    }
    if (ordinal === Direction.LEFT.toString()) {
        return Direction.LEFT;
    }
    if (ordinal === Direction.TOP_LEFT.toString()) {
        return Direction.TOP_LEFT;
    }
}
// Traduit une position en pixel du curseur vers un emplacement/des coordonnées de la grille.
// Ce calcul est utile pour simplifier les calculs, puisque que tout peut se faire suivant un
// système de coordonnées relatif à la grille.
function viewPortToGridPos(grid, cursorX, cursorY) {
    var gridBounds = grid.html.getBoundingClientRect();
    var cursorXRelativeToGrid = cursorX - gridBounds.left;
    var cursorYRelativeToGrid = cursorY - gridBounds.top;
    if (cursorXRelativeToGrid < 0) {
        cursorXRelativeToGrid = 0;
    }
    if (cursorYRelativeToGrid < 0) {
        cursorYRelativeToGrid = 0;
    }
    var currentColWidth = Math.floor((gridBounds.width / grid.colsCount));
    var cursorTileX = Math.floor(cursorXRelativeToGrid / currentColWidth);
    var cursorTileY = Math.floor(cursorYRelativeToGrid / grid.rowsHeight);
    // + 1 parce que CSS grid démarre de 1 et non 0.
    cursorTileX = cursorTileX + 1;
    cursorTileY = cursorTileY + 1;
    if (cursorTileX > grid.colsCount) {
        cursorTileX = grid.colsCount;
    }
    return [cursorTileX, cursorTileY];
}
// Vérifie si l'élément passé en second argument chevauche un autre élément de la grille.
// Si c'est le cas, "true" est retourné, sinon "false".
function checkForOverlap(grid, item) {
    for (var _i = 0, _a = grid.items; _i < _a.length; _i++) {
        var otherItem = _a[_i];
        if (item !== otherItem && isOverlapping(item, otherItem)) {
            return true;
        }
    }
    return false;
}
// Vérifie si les deux éléments passés en argument se chevauchent.
// Si c'est le cas, "true" est retourné, sinon "false".
function isOverlapping(item, otherItem) {
    if (+item.style.gridColumnEnd <= +otherItem.style.gridColumnStart ||
        +item.style.gridRowEnd <= +otherItem.style.gridRowStart ||
        +item.style.gridColumnStart >= +otherItem.style.gridColumnEnd ||
        +item.style.gridRowStart >= +otherItem.style.gridRowEnd) {
        return false;
    }
    return true;
}
// Transforme un élément HTML en élément de grille.
// Cela se traduit par :
// - Ajout de la classe qui va bien.
// - Ajout des éléments de redimensionnement.
// - Ajout de l'élément de déplacement.
function transformToGridItem(item) {
    item.classList.add("grid__item");
    var makeResizer = function (direction) {
        var resizerDivEl = document.createElement("div");
        resizerDivEl.classList.add("grid__item__resizer");
        resizerDivEl.setAttribute("data-direction", direction.toString());
        return resizerDivEl;
    };
    var topResizer = makeResizer(Direction.TOP);
    var topRightResizer = makeResizer(Direction.TOP_RIGHT);
    var rightResizer = makeResizer(Direction.RIGHT);
    var bottomRightResizer = makeResizer(Direction.BOTTOM_RIGHT);
    var bottomResizer = makeResizer(Direction.BOTTOM);
    var bottomLeftResizer = makeResizer(Direction.BOTTOM_LEFT);
    var leftResizer = makeResizer(Direction.LEFT);
    var topLeftResizer = makeResizer(Direction.TOP_LEFT);
    item.appendChild(topResizer);
    item.appendChild(topRightResizer);
    item.appendChild(rightResizer);
    item.appendChild(bottomRightResizer);
    item.appendChild(bottomResizer);
    item.appendChild(bottomLeftResizer);
    item.appendChild(leftResizer);
    item.appendChild(topLeftResizer);
    var content = document.createElement("div");
    content.classList.add("grid__item__content");
    item.appendChild(content);
    return item;
}
// Applique les événements sur les composants de redimensionnement de l'élément passé en argument
// pour leur permettre de lancer une édition de type Transform.RESIZE.
function setupResizers(item, editCtx) {
    var resizers = item.querySelectorAll(".grid__item__resizer");
    for (var i = 0; i < resizers.length; i++) {
        resizers[i].addEventListener('mousedown', function (ev) {
            if (!editCtx.active) {
                var resizerHtml = ev.target;
                var itemHtml = resizerHtml.parentNode;
                var directionOrdinal = resizerHtml.getAttribute("data-direction");
                editCtx.active = true;
                editCtx.activeTransform = TransformType.RESIZE;
                editCtx.direction = getDirectionFromOrdinal(directionOrdinal);
                editCtx.initialGridColumnStart = +itemHtml.style.gridColumnStart;
                editCtx.initialGridColumnEnd = +itemHtml.style.gridColumnEnd;
                editCtx.initialGridRowStart = +itemHtml.style.gridRowStart;
                editCtx.initialGridRowEnd = +itemHtml.style.gridRowEnd;
                editCtx.target = itemHtml;
            }
        });
    }
}
;
// Applique un événement sur le composant de déplacement de l'élément passé en argument
// pour permettre de lancer une édition de type Transform.MOVE.
function setupGrabber(item, editCtx) {
    var grabber = item.querySelector(".grid__item__content");
    grabber.addEventListener('mousedown', function (ev) {
        if (!editCtx.active) {
            var tilePos = viewPortToGridPos(grid, ev.pageX, ev.pageY);
            var grabberHtml = ev.target;
            var itemHtml = grabberHtml.parentNode;
            editCtx.active = true;
            editCtx.activeTransform = TransformType.MOVE;
            editCtx.initialCursorTileX = tilePos[0];
            editCtx.initialCursorTileY = tilePos[1];
            editCtx.initialGridColumnStart = +itemHtml.style.gridColumnStart;
            editCtx.initialGridColumnEnd = +itemHtml.style.gridColumnEnd;
            editCtx.initialGridRowStart = +itemHtml.style.gridRowStart;
            editCtx.initialGridRowEnd = +itemHtml.style.gridRowEnd;
            editCtx.target = itemHtml;
        }
    });
}
;
// Ré-initialise le contexte d'édition vers son état initial.
function resetEditCtx(editCtx) {
    editCtx.target.classList.remove("overlapping");
    editCtx.active = false;
    editCtx.activeTransform = TransformType.NONE;
    editCtx.currentCursorTileX = 0;
    editCtx.currentCursorTileY = 0;
    editCtx.currentCursorX = 0;
    editCtx.currentCursorY = 0;
    editCtx.initialGridColumnStart = 0;
    editCtx.initialGridColumnEnd = 0;
    editCtx.initialGridRowStart = 0;
    editCtx.initialGridRowEnd = 0;
    editCtx.target = null;
    editCtx.direction = Direction.NONE;
    editCtx.initialCursorTileX = 0;
    editCtx.initialCursorTileY = 0;
}
/*
 *
 * LOGIQUE ICI #####################################################################################
 *
 */
// Bouton d'ajout d'un élément dans la grille.
var addBtn = document.getElementById("add-item");
// La grille présente dans la page, le prototype ne se base que sur une grille.
var grid = {
    html: document.getElementById("grid"),
    colsCount: 12,
    rowsCount: 0,
    rowsHeight: 150,
    items: [],
};
// Initialisation du contexte d'édition de la grille.
var editCtx = {
    // Attributs communs aux types d'édition.
    active: false,
    activeTransform: TransformType.NONE,
    currentCursorTileX: 0,
    currentCursorTileY: 0,
    currentCursorX: 0,
    currentCursorY: 0,
    // Attributs utilisés pour le déplacement et le redimensionnement.
    initialGridColumnStart: 0,
    initialGridColumnEnd: 0,
    initialGridRowStart: 0,
    initialGridRowEnd: 0,
    target: null,
    // Attributs utilisés pour le redimensionnement.
    direction: Direction.NONE,
    // Attributs utilisés pour le déplacement.
    initialCursorTileX: 0,
    initialCursorTileY: 0,
};
// Ajout d'un événement sur le bouton pour activer le mode d'insertion d'un élément.
addBtn.addEventListener("click", function (ev) {
    ev.preventDefault();
    // On ne permet qu'une édition à la fois.
    if (!editCtx.active) {
        editCtx.active = true;
        editCtx.activeTransform = TransformType.INSERT;
        editCtx.target = document.createElement("div");
        editCtx.target.classList.add("to-insert");
        grid.html.appendChild(editCtx.target);
        grid.items.push(editCtx.target);
    }
});
// Ajout d'un événement sur la grille pour écouter les mouvements de la souris et
// éditer les éléments en temps réel.
grid.html.addEventListener("mousemove", function (ev) {
    if (!editCtx.active)
        return;
    // On récupère la position de la souris dans la grille. Pour simplifier les modifications/calculs.
    var tilePos = viewPortToGridPos(grid, ev.pageX, ev.pageY);
    if (editCtx.activeTransform == TransformType.INSERT) {
        // Si le mode d'édition est l'insertion, on déplace le nouvel élément à l'emplacement du curseur.
        editCtx.target.style.gridColumnStart = "".concat(tilePos[0]);
        editCtx.target.style.gridColumnEnd = "".concat(tilePos[0] + 1);
        editCtx.target.style.gridRowStart = "".concat(tilePos[1]);
        editCtx.target.style.gridRowEnd = "".concat(tilePos[1] + 1);
    }
    else if (editCtx.activeTransform == TransformType.RESIZE) {
        // Si le mode d'édition est le redimensionnement, on modifie les valeurs grid de l'élément
        // en fonction de la direction et de la position du curseur.
        switch (editCtx.direction) {
            case Direction.TOP:
                if (tilePos[1] < +editCtx.target.style.gridRowEnd) { // NOTE: évite les collapses ou les inversions de sens.
                    editCtx.target.style.gridRowStart = "".concat(tilePos[1]);
                }
                break;
            case Direction.TOP_RIGHT:
                if (tilePos[1] < +editCtx.target.style.gridRowEnd) {
                    editCtx.target.style.gridRowStart = "".concat(tilePos[1]);
                }
                if ((tilePos[0] + 1) > +editCtx.target.style.gridColumnStart) {
                    editCtx.target.style.gridColumnEnd = "".concat(tilePos[0] + 1);
                }
                break;
            case Direction.RIGHT:
                if ((tilePos[0] + 1) > +editCtx.target.style.gridColumnStart) {
                    editCtx.target.style.gridColumnEnd = "".concat(tilePos[0] + 1);
                }
                break;
            case Direction.BOTTOM_RIGHT:
                if ((tilePos[1] + 1) > +editCtx.target.style.gridRowStart) {
                    editCtx.target.style.gridRowEnd = "".concat(tilePos[1] + 1);
                }
                if ((tilePos[0] + 1) > +editCtx.target.style.gridColumnStart) {
                    editCtx.target.style.gridColumnEnd = "".concat(tilePos[0] + 1);
                }
                break;
            case Direction.BOTTOM:
                if ((tilePos[1] + 1) > +editCtx.target.style.gridRowStart) {
                    editCtx.target.style.gridRowEnd = "".concat(tilePos[1] + 1);
                }
                break;
            case Direction.BOTTOM_LEFT:
                if ((tilePos[1] + 1) > +editCtx.target.style.gridRowStart) {
                    editCtx.target.style.gridRowEnd = "".concat(tilePos[1] + 1);
                }
                if (tilePos[0] < +editCtx.target.style.gridColumnEnd) {
                    editCtx.target.style.gridColumnStart = "".concat(tilePos[0]);
                }
                break;
            case Direction.LEFT:
                if (tilePos[0] < +editCtx.target.style.gridColumnEnd) {
                    editCtx.target.style.gridColumnStart = "".concat(tilePos[0]);
                }
                break;
            case Direction.TOP_LEFT:
                if (tilePos[1] < +editCtx.target.style.gridRowEnd) {
                    editCtx.target.style.gridRowStart = "".concat(tilePos[1]);
                }
                if (tilePos[0] < +editCtx.target.style.gridColumnEnd) {
                    editCtx.target.style.gridColumnStart = "".concat(tilePos[0]);
                }
                break;
            default: break;
        }
    }
    else if (editCtx.activeTransform == TransformType.MOVE) {
        // Si le mode d'édition est le déplacement, on déplace le nouvel élément par rapport à
        // l'emplacement du curseur.
        // Petite particularité ici, un élément peut s'étend sur plusieurs lignes et colonnes,
        // et le déplacement peut commencer n'importe où dans cet étendu,
        // il faut donc changer les propriétés de grid en y ajoutant seulement la différence de
        // déplacement.
        var colStartDiff = editCtx.initialCursorTileX - editCtx.initialGridColumnStart;
        var colEndDiff = editCtx.initialGridColumnEnd - editCtx.initialCursorTileX;
        var rowStartDiff = editCtx.initialCursorTileY - editCtx.initialGridRowStart;
        var rowEndDiff = editCtx.initialGridRowEnd - editCtx.initialCursorTileY;
        var newGridColumnStart = tilePos[0] - colStartDiff;
        var newGridColumnEnd = tilePos[0] + colEndDiff;
        var newGridRowStart = tilePos[1] - rowStartDiff;
        var newGridRowEnd = tilePos[1] + rowEndDiff;
        //// Vérifie si les calculs dépasse les limites de la grille.
        var isCrossingGridBounds = false;
        if (newGridColumnStart < 1 || newGridRowStart < 1 || newGridColumnEnd > grid.colsCount + 1) {
            isCrossingGridBounds = true;
        }
        if (!isCrossingGridBounds) {
            editCtx.target.style.gridColumnStart = "".concat(newGridColumnStart);
            editCtx.target.style.gridColumnEnd = "".concat(newGridColumnEnd);
            editCtx.target.style.gridRowStart = "".concat(newGridRowStart);
            editCtx.target.style.gridRowEnd = "".concat(newGridRowEnd);
        }
    }
    if (editCtx.target != null) {
        // Si une fois édité la cible se trouve sur un emplacement invalide, on lui ajoute une classe
        // indiquant cet état, ce qui permet d'y appliquer un style.
        if (checkForOverlap(grid, editCtx.target)) {
            if (!editCtx.target.classList.contains("overlapping")) {
                editCtx.target.classList.add("overlapping");
            }
        }
        else {
            if (editCtx.target.classList.contains("overlapping")) {
                editCtx.target.classList.remove("overlapping");
            }
        }
    }
});
// Ajout d'un événement sur la grille pour écouter le moment ou le clique de la souris est relâché.
grid.html.addEventListener("mouseup", function (ev) {
    if (!editCtx.active)
        return;
    // On récupère la position de la souris dans la grille. Pour simplifier les modifications/calculs.
    var tilePos = viewPortToGridPos(grid, ev.pageX, ev.pageY);
    if (editCtx.activeTransform == TransformType.RESIZE || editCtx.activeTransform == TransformType.MOVE) {
        // Si la nouvelle position est invalide, on remet l'élément à son emplacement de départ.
        if (checkForOverlap(grid, editCtx.target)) {
            editCtx.target.style.gridColumnStart = "".concat(editCtx.initialGridColumnStart);
            editCtx.target.style.gridColumnEnd = "".concat(editCtx.initialGridColumnEnd);
            editCtx.target.style.gridRowStart = "".concat(editCtx.initialGridRowStart);
            editCtx.target.style.gridRowEnd = "".concat(editCtx.initialGridRowEnd);
        }
        // On clean le contexte d'édition, dabs le cas un redimensionnement ou d'un déplacement.
        resetEditCtx(editCtx);
    }
});
// Ajout d'un événement sur la grille pour écouter le moment ou un clique de la souris survient.
// Utile quand l'on est en mode insertion pour placer le nouvel élément sur l'emplacement cliqué.
grid.html.addEventListener("click", function (ev) {
    var tilePos = viewPortToGridPos(grid, ev.pageX, ev.pageY);
    if (editCtx.active && editCtx.activeTransform == TransformType.INSERT) {
        if (checkForOverlap(grid, editCtx.target))
            return;
        editCtx.target.classList.remove("to-insert");
        transformToGridItem(editCtx.target);
        setupResizers(editCtx.target, editCtx);
        setupGrabber(editCtx.target, editCtx);
        resetEditCtx(editCtx);
    }
});

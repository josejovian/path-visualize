import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

function parseDelta(delta) {
	if (delta[0] === 0) {
		if (delta[1] === 1) return "right";
		return "left";
	} else {
		if (delta[0] === 1) return "down";
		return "up";
	}
}

function unparseDelta(delta) {
	switch (delta) {
		case "up":
			return [-1, 0];
		case "down":
			return [1, 0];
		case "left":
			return [0, -1];
		case "right":
			return [0, 1];
	}
}

function getOpposite(move) {
	switch (move) {
		case "up":
			return "down";
		case "down":
			return "up";
		case "left":
			return "right";
		case "right":
			return "left";
	}
}

function shuffleArray(array) {
	const _array = [],
		length = array.length;
	for (let i = 0; i < length; i++) {
		const random = Math.floor(Math.random() * array.length);
		_array.push(array[random]);
		array = array.filter((d, idx) => idx !== random);
	}
	return _array;
}

function checkBoundary(y, x, dimensions) {
	return x >= 0 && dimensions[1] > x && y >= 0 && dimensions[0] > y;
}

function checkIntersect(y, x, delta, __map) {
	const target = __map[y][x];
	return target.up + target.right + target.left + target.down <= 0;
}

function getValidMovements(y, x, dimensions, __map) {
	let delta = [...templateDelta],
		_delta = [];

	_delta = shuffleArray(delta);

	const results = _delta.map((d) => {
		return [
			y + d[0],
			x + d[1],
			parseDelta(d),
			Math.floor(Math.random() * 1000),
		];
	});

	return results.filter(
		(r) =>
			checkBoundary(r[0], r[1], dimensions) &&
			checkIntersect(r[0], r[1], _delta, __map) &&
			!__map[r[0]][r[1]].visited
	);
}

const templateDelta = [
	[0, 1],
	[1, 0],
	[0, -1],
	[-1, 0],
];

export default function Home() {
	const [map, setMap] = useState(null);
	const [wrapper, setWrapper] = useState(null);
	const [init, setInit] = useState(0);
	const [start, setStart] = useState([1, 1]);
	const [dimensions, setDimensions] = useState([6, 12]);
	const [goal, setGoal] = useState([
		2 * dimensions[0] - 1,
		2 * dimensions[1] - 1,
	]);
	const [terminate, setTerminate] = useState(false);
	const [working, setWorking] = useState(false);
	const [colors, setColors] = useState([]);

	const [resetButton, setResetButton] = useState(false);

	const backtrack = useCallback((path, previous) => {
		let [y, x] = path.pop();
		let [_y, _x] = previous;

		if (Math.abs(y - _y) + Math.abs(x - _x) <= 1) {
			const _wrapper = [...wrapper];
			_wrapper[y][x].backtrack = true;
			setWrapper(_wrapper);

			if (y === start[0] && x === start[1]) {
				setTimeout(() => {
					setTerminate(true);
					setWorking(false);
				}, 500);
				return;
			}
		} else {
			y = _y;
			x = _x;
		}

		if (path.length > 0) {
			setTimeout(() => {
				backtrack(path, [y, x]);
			}, 1);
		}
	}, [start, wrapper]);

	const traverse = useCallback((algorithm = "dfs") => {
		if (working) {
			return;
		}
		setWorking(true);

		const stack = [[1, 1, 1]];
		let answer = [];

		function oneTraverse(path) {
			if (terminate || stack.length === 0) {
				setTerminate(true);
				setWorking(false);
				return;
			}

			let y, x, step;

			switch (algorithm) {
				case "bfs":
					[y, x, step] = stack.shift();
					break;
				case "dfs":
					[y, x, step] = stack.pop();
					break;
			}

			path.push([y, x]);

			const _wrapper = [...wrapper];
			if (_wrapper[y][x].distance === -1) _wrapper[y][x].distance = step;
			setWrapper(_wrapper);

			const [gY, gX] = goal;

			if (y === gY && x === gX) {
				backtrack(path, [y, x]);
				return;
			}

			const directions = ["up", "down", "left", "right"];

			let _links = [];

			directions.forEach((d) => {
				const _d = unparseDelta(d);
				const [_y, _x] = [y + _d[0], x + _d[1]];

				if (wrapper[y][x][d] === 1) {
					if (
						_y >= 0 &&
						dimensions[0] * 2 + 1 > _y &&
						_x >= 0 &&
						dimensions[1] * 2 + 1 > _x &&
						!_wrapper[_y][_x].wall
					)
						_links.push([_y, _x]);
				}
			});

			if (_links.length === 0) return;

			_links.forEach((pos) => {
				const [_y, _x] = pos;
				if (!_wrapper[_y][_x].visited) {
					_wrapper[_y][_x].visited = true;
					stack.push([_y, _x, step + 1]);
				}
			});

			setWrapper(_wrapper);

			if (stack.length > 0) {
				setTimeout(() => {
					oneTraverse(path);
				}, 1);
			} else {
				setTerminate(true);
				setWorking(false);
			}
		}

		oneTraverse([...answer]);
	}, [backtrack, dimensions, goal, terminate, working, wrapper]);

	const generateMaze = useCallback(() => {
		if (!map) return;

		setInit(1);

		const random = Math.ceil(Math.random() * dimensions[0]) - 1;

		let list = [[random, random]];
		const _map = [...map];

		while (list.length > 0) {
			list = list.sort((a, b) => {
				return a[3] - b[3];
			});

			const [y, x] = list.shift();

			if (_map[y][x].visited) continue;

			_map[y][x].visited = true;

			if (!checkBoundary(y, x, dimensions)) continue;

			let possible = shuffleArray(
				getValidMovements(y, x, dimensions, _map)
			);

			if (possible.length === 0) {
				continue;
			}

			possible.forEach((move, idx) => {
				const [_y, _x, d] = move;
				if (idx < 4) {
					_map[y][x][d] = 1;
					_map[_y][_x][getOpposite(d)] = 1;
					list.push([...move, Math.floor(Math.random() * 1000)]);
				}
			});
			setMap(_map);
		}

		setInit(2);
	}, [dimensions, map]);

	const generateMazeWrapper = useCallback(() => {
		setInit(3);

		let templateWrapper = [];

		for (let j = 0; j < dimensions[0] * 2 + 1; j++) {
			const templateRow = [];
			for (let i = 0; i < dimensions[1] * 2 + 1; i++) {
				templateRow.push({
					wall: true,
					visited: false,
					distance: -1,
				});
			}
			templateWrapper.push(templateRow);
		}

		for (let j = 0; j < dimensions[0] * 2 + 1; j++) {
			for (let i = 0; i < dimensions[1] * 2 + 1; i++) {
				if (j % 2 === 0 || i % 2 === 0) {
					templateWrapper[j][i].wall = true;
				}
			}
		}

		for (let j = 1; j < dimensions[0] * 2 + 1; j++) {
			for (let i = 1; i < dimensions[1] * 2 + 1; i++) {
				if (j % 2 === 1 && i % 2 === 1) {
					templateWrapper[j][i] = {
						...map[Math.floor(j / 2)][Math.floor(i / 2)],
						wall: false,
						visited: false,
						backtrack: false,
						distance: -1,
					};
				}

				if (j % 2 === 1 && i % 2 === 0 && i > 0) {
					const [y, x] = [Math.floor(j / 2), Math.floor((i - 1) / 2)];
					if (
						checkBoundary(y, x + 1, dimensions) &&
						map[y][x].right === 1 &&
						map[y][x + 1].left === 1
					) {
						templateWrapper[j][i] = {
							left: 1,
							right: 1,
							wall: false,
							visited: false,
							backtrack: false,
							distance: -1,
						};
					}
				}

				if (j % 2 === 0 && i % 2 === 1 && j > 0) {
					const [y, x] = [Math.floor((j - 1) / 2), Math.floor(i / 2)];
					if (
						checkBoundary(y + 1, x, dimensions) &&
						map[y][x].down === 1 &&
						map[y + 1][x].up === 1
					) {
						templateWrapper[j][i] = {
							down: 1,
							up: 1,
							wall: false,
							visited: false,
							backtrack: false,
							distance: -1,
						};
					}
				}
			}
		}

		setWrapper(templateWrapper);
	}, [dimensions, map]);

	const initializeMaze = useCallback(() => {
		let templateMap = [];

		for (let j = 0; j < dimensions[0]; j++) {
			const templateRow = [];
			for (let i = 0; i < dimensions[1]; i++) {
				templateRow.push({
					up: 0,
					left: 0,
					right: 0,
					down: 0,
					visited: false,
					traversed: false,
				});
			}
			templateMap.push(templateRow);
		}

		setMap(templateMap);
	}, [dimensions]);

	function resetMaze() {
		setTerminate(false);
		setResetButton(true);

		initializeMaze();
		setTimeout(() => {
			generateMaze();
		}, 200);
		setTimeout(() => {
			generateMazeWrapper();
		}, 400);
		setTimeout(() => {
			setResetButton(false);
		}, 600);
	}

	const toggleWall = useCallback((y, x) => {
		if (working || terminate) return;
		if (y === start[0] && x === start[1]) return;
		if (y === goal[0] && x === goal[1]) return;

		const _wrapper = [...wrapper];
		const isWall = _wrapper[y][x].wall;
		_wrapper[y][x].wall = !isWall;
		templateDelta.forEach((d) => {
			const _y = y + d[0],
				_x = x + d[1];
			if (checkBoundary(_y, _x, dimensions)) {
				const direction1 = _wrapper[y][x][parseDelta(d)];
				const direction2 = _wrapper[_y][_x][getOpposite(parseDelta(d))];
				_wrapper[y][x][parseDelta(d)] = 1 - direction1;
				_wrapper[_y][_x][getOpposite(parseDelta(d))] = 1 - direction2;
			}
		});
		setWrapper(_wrapper);
	}, [dimensions, goal, start, terminate, working, wrapper]);

	const emptyBoard = useCallback(() => {
		setTerminate(false);

		const _wrapper = [...wrapper];
		for (let y = 0; y < 2 * dimensions[0]; y++) {
			for (let x = 0; x < 2 * dimensions[1]; x++) {
				if (x === 0 || x === 2 * dimensions[1] - 1) continue;
				if (y === 0 || y === 2 * dimensions[1] - 1) continue;

				templateDelta.forEach((d) => {
					const _y = y + d[0],
						_x = x + d[1];
					if (
						_y > 0 &&
						2 * dimensions[0] > _y &&
						_x > 0 &&
						2 * dimensions[1] > _x
					) {
						_wrapper[y][x].wall = false;
						_wrapper[_y][_x].wall = false;
						_wrapper[_y][_x].visited = false;
						_wrapper[_y][_x].distance = -1;
						_wrapper[_y][_x].backtrack = false;
						_wrapper[y][x][parseDelta(d)] = 1;
						_wrapper[_y][_x][getOpposite(parseDelta(d))] = 1;
					}
				});
			}
		}
		setWrapper(_wrapper);
	}, [dimensions, wrapper]);

	useEffect(() => {
		initializeMaze();
	}, [initializeMaze]);

	useEffect(() => {
		if (init === 0 && map) {
			generateMaze();
		}

		if (init === 2) {
			generateMazeWrapper();
		}
	}, [map, init, generateMaze, generateMazeWrapper]);

	return (
		<div
			className="flex flex-col items-center"
			onContextMenu={(e) => {
				e.preventDefault();
				return false;
			}}
		>
			<table>
				<tbody>
					{wrapper &&
						wrapper.map((row, idx1) => (
							<tr key={`cell-${idx1}`}>
								{row.map((column, idx2) => {
									const {
										wall,
										visited,
										distance,
										backtrack,
									} = column;
									return (
										<td
											key={`cell-${idx1}-${idx2}`}
											onClick={() =>
												toggleWall(idx1, idx2)
											}
											className={clsx(
												"w-8 h-8 text-center",
												"border-2 border-white text-xs",
												wall &&
													"bg-teal-800 hover:bg-teal-900",
												distance > -1
													? "visited hover:bg-teal-400"
													: "unvisited",
												distance === -1 &&
													!wall &&
													"hover:bg-gray-200",
												backtrack && "backtrack",
												idx1 === start[0] &&
													idx2 === start[1] &&
													"bg-green-400 hover:bg-green-600",
												idx1 === goal[0] &&
													idx2 === goal[1] &&
													"bg-orange-400 hover:bg-orange-600"
											)}
										>
											{!wall && distance > 0 && distance}
										</td>
									);
								})}
							</tr>
						))}
				</tbody>
			</table>
			<div className="flex items-center mt-4 gap-4">
				<button
					disabled={working || resetButton}
					onClick={() => resetMaze()}
				>
					New Maze
				</button>
				<button
					disabled={working || resetButton}
					onClick={() => emptyBoard()}
				>
					Clear Board
				</button>
				<button
					disabled={working || resetButton}
					onClick={() => traverse("bfs")}
				>
					BFS
				</button>
				<button
					disabled={working || resetButton}
					onClick={() => traverse("dfs")}
				>
					DFS
				</button>
			</div>
		</div>
	);
}

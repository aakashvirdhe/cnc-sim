


CWS.UI = function (controller) {
	this.controller = controller;
	var topMenu = $("#topMenu");
	// Removed legacy hover resize logic as it conflicts with new dropdown behavior
	// $("#topMenu>nav > ul > li").each(function (i) {
	// 	$(this)
	// 		.mouseenter(function () { topMenu.css('height', '90px'); })
	// 		.mouseleave(function () { topMenu.css('height', '45px'); })
	// });
	topMenu.click(
		function (ev) {
			var title = ev.target.title
			console.log("TopMenu Clicked:", title); // Debug log
			switch (title) {
				case "New Project":
					var d = new CWS.DialogBox(title);
					d.newProject(controller);
					break;
				case "Open Project":
					var d = new CWS.DialogBox(title);
					d.openProject(controller);
					break;
				case "Open Machine":
					var d = new CWS.DialogBox(title);
					d.openMachine(controller);
					break;
				case "Workpiece dimensions":
					var d = new CWS.DialogBox(title);
					d.workpieceDimensions(controller);
					break;
				case "Material Settings":
					var d = new CWS.DialogBox(title);
					d.materialSettings(controller);
					break;
				case "Export File":
					controller.exportToOBJ();
					break;
				case "Tool":
					var d = new CWS.DialogBox(title);
					d.tool(controller);
					break;
				default:
					break;
			}
		});

	this.elementEditor = $(document.getElementById("editor"));
	this.elementTopMenu = $(document.getElementById("topMenu"));
	this.elementCanvasContainer = $(document.getElementById("canvasContainer"));
	this.elementBottomMenu = $(document.getElementById("bottomMenu"));
	this.elementBody = $(document.body);
	this.resize();
	$("#saveIcon").css('color', 'green').click(function (ev) {
		controller.save(true);
	});
	$("#autoRunIcon").css('color', 'green').click(function () {
		controller.autoRun = !controller.autoRun;
		if (controller.autoRun === false)
			$(this).css('color', 'red');
		else {
			$(this).css('color', 'green');
			controller.runInterpreter(true);
		}
	});
	$("#runIcon").click(function (ev) {
		controller.runInterpreter(true);
	});
	$("#run2DIcon").css('color', 'green').click(function (ev) {
		controller.run2D = !controller.run2D;
		if (controller.run2D === false)
			$(this).css('color', 'red');
		else {
			$(this).css('color', 'green');
		}
		controller.update2D();
	});
	$("#run3DIcon").css('color', 'green').click(function (ev) {
		controller.run3D = !controller.run3D;
		if (controller.run3D === false)
			$(this).css('color', 'red');
		else {
			$(this).css('color', 'green');
		}
		controller.update3D();
	});
	var color = "green";
	if (controller.renderer.displayWireframe === false)
		color = "red";
	$("#wireframeIcon").css('color', color).click(function (ev) {
		controller.runWireframe = !controller.runWireframe;
		if (controller.runWireframe === false) {
			$(this).css('color', 'red');
		}
		else {
			$(this).css('color', 'green');
		}
	});
	$("#runAnimationIcon").click(function (ev) {
		controller.runAnimation();
	});

	// Bridge for React BottomBar
	window.addEventListener('requestSimulation', function () {
		// We assume 'Simulate' means run interpreter, as that's the core action
		controller.runInterpreter(true);
	});

	window.addEventListener('stopSimulationTrigger', function () {
		if (controller.stopInterpreter) {
			controller.stopInterpreter();
		} else {
			console.warn("stopInterpreter not implemented");
		}
	});
}

CWS.UI.prototype.constructor = CWS.UI;

CWS.UI.prototype.resize = function () {
	/*
	var width = this.elementBody.innerWidth();
	var height = this.elementBody.innerHeight();
	
	var editorWidth;
	if (this.elementEditor.css('display')==='none')
		editorWidth = 0;
	else
		editorWidth = this.elementEditor.innerWidth();

	this.elementTopMenu.innerWidth(width-editorWidth);
	this.elementCanvasContainer.innerWidth(width-editorWidth);
	this.controller.renderer.setSize(width-editorWidth,height);
	this.elementBottomMenu.innerWidth(width-editorWidth);
	*/

	// Just trigger renderer resize, but let CSS handle container sizes
	var width = this.elementCanvasContainer.innerWidth();
	var height = this.elementCanvasContainer.innerHeight();
	if (this.controller && this.controller.renderer) {
		this.controller.renderer.setSize(width, height);
	}
};

CWS.UI.prototype.createStats = function (v) {
	if (v === false)
		return { update: function () { } };
	var maincanvasdiv = document.getElementById("canvasContainer");
	var width = maincanvasdiv.offsetWidth;
	var height = maincanvasdiv.offsetHeight;

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.right = '0px';
	maincanvasdiv.appendChild(stats.domElement);
	return stats;
};

CWS.DialogBox = function (title) {
	$("#dialogBox").remove();

	this.dialog = $('<div id="dialogBox" title="' + title + '" ></div>');
}

CWS.DialogBox.prototype.constructor = CWS.DialogBox;

CWS.DialogBox.prototype.newProject = function (controller) {
	var html = '<form id="menuNewProject">' +
		'<ul>' +
		'  <li>' +
		'    <label for= "projectName" >Project Name</label>' +
		'    <input type= "text" name= "projectName" />' +
		'  </li>' +
		'  <li>' +
		'    <label for= "machineType" >Machine</label>' +
		'    <input type="radio" name="machineType" value="Lathe" checked> Lathe' +
		'    <input type="radio" name="machineType" value="Mill"> Mill' +
		'  </li>' +
		'</ul>' +
		'</form>';
	this.dialog.append($(html));
	this.dialog.dialog(
		{
			width: 400,
			buttons:
			{
				"Create": function () {
					var values = {};
					var result = $(this.firstChild).serializeArray();
					for (var i = 0; i < result.length; i++) {
						values[result[i].name] = result[i].value;
					}
					controller.createProject(values);
					$(this).dialog("close");
				},
				"Cancel": function () {
					$(this).dialog("close");
				}
			}
		});
};

CWS.DialogBox.prototype.openProject = function (controller) {
	// Toolbar for deletion
	var toolbar = $('<div style="margin-bottom: 10px; padding: 5px; border-bottom: 1px solid var(--border-color);">' +
		'<button id="btnSelectAll" class="ui-button" style="margin-right: 5px; font-size: 0.8em; width: auto !important;">All</button>' +
		'<button id="btnSelectNone" class="ui-button" style="margin-right: 5px; font-size: 0.8em; width: auto !important;">None</button>' +
		'<button id="btnDeleteSelected" class="ui-button" style="margin-left: 10px; font-size: 0.8em; background-color: var(--danger-color) !important; color: white !important; width: auto !important;">Delete</button>' +
		'</div>');

	var html = '<ul class="tableList">';
	var fileList = Object.keys(controller.listProjects());
	for (var i = 0; i < fileList.length; i++) {
		html += '<li data-project="' + fileList[i] + '" style="position: relative; padding-left: 40px;">' +
			'<input type="checkbox" class="project-checkbox" value="' + fileList[i] + '" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: auto; margin: 0; z-index: 10;">' +
			'<span class="icon icon-file-text2"></span>' + fileList[i] + '</li>';
	}
	html += "</ul>";

	var dialog = this.dialog;
	this.dialog.append(toolbar);
	this.dialog.append(html);

	// Event Handlers - Attach directly to the created elements to ensure they are bound
	// before being added to the DOM or if they are in a fragment.
	toolbar.find('#btnSelectAll').click(function () {
		dialog.find('.project-checkbox').prop('checked', true);
	});

	toolbar.find('#btnSelectNone').click(function () {
		dialog.find('.project-checkbox').prop('checked', false);
	});

	toolbar.find('#btnDeleteSelected').click(function () {
		var selected = [];
		// Use dialog.find because .project-checkbox might not be in the document yet if scoped incorrectly,
		// though normally safe if looking within 'dialog' context.
		dialog.find('.project-checkbox:checked').each(function () {
			selected.push($(this).val());
		});

		if (selected.length > 0) {
			// Replace native confirm with custom dialog
			var d = new CWS.DialogBox("Confirm Deletion");
			d.confirmDeleteProjects(controller, selected);
		} else {
			alert("Select projects to delete");
		}
	});

	// Use delegated events for the list items since they are dynamic string HTML
	this.dialog.on('click', '.project-checkbox', function (e) {
		e.stopPropagation();
	});

	this.dialog.on('click', 'li', function (event) {
		// Ignore if clicking the checkbox itself (handled above, but double check target)
		if ($(event.target).is(':checkbox') || $(event.target).hasClass('project-checkbox')) return;

		var projectName = $(this).data('project');
		if (projectName) {
			controller.openProject(projectName);
			dialog.dialog("close");
		}
	});

	this.dialog.dialog(
		{
			width: 450,
			title: "Open Project (Select to Delete)",
			buttons:
			{
				"Cancel": function () {
					$(this).dialog("close");
				}
			}
		});
};

CWS.DialogBox.prototype.confirmDeleteProjects = function (controller, projectList) {
	var html = '<div style="padding: 10px;"><p>Are you sure you want to delete the following projects?</p>' +
		'<ul class="tableList" style="max-height: 200px; overflow-y: auto; margin-top: 10px;">';

	for (var i = 0; i < projectList.length; i++) {
		html += '<li><span class="icon icon-file-text2"></span>' + projectList[i] + '</li>';
	}
	html += '</ul></div>';

	this.dialog.append(html);
	this.dialog.dialog({
		width: 450,
		title: "Confirm Deletion",
		modal: true,
		buttons: {
			"Delete": function () {
				controller.deleteProjects(projectList);
				$(this).dialog("close");
			},
			"Cancel": function () {
				// Re-open the project list dialog
				var d = new CWS.DialogBox("Open Project");
				d.openProject(controller);
			}
		}
	});
};

CWS.DialogBox.prototype.openMachine = function (controller) {
	html = '<ul class="tableList">' +
		'  <li><span class="icon icon-lathe"></span>Lathe</li>' +
		'  <li><span class="icon icon-mill"></span>Mill</li>' +
		'</ul>';
	var dialog = this.dialog;
	html = $(html).click(function (event) {
		if (event.target.parentElement.tagName.toLocaleLowerCase() == "div")
			return;
		var machineName = "";
		if (event.target.tagName.toLocaleLowerCase() == "li") {
			machineName = event.target.textContent;
		}
		else {
			machineName = event.target.parentElement.textContent;
		}
		controller.openMachine(machineName);
		dialog.dialog("close");
	});
	this.dialog.append(html);
	this.dialog.dialog(
		{
			width: 400,
			buttons:
			{
				"Cancel": function () {
					$(this).dialog("close");
				}
			}
		});
};

CWS.DialogBox.prototype.workpieceDimensions = function (controller) {
	var machineType = controller.getMachineType();
	var workpiece = controller.getWorkpiece();
	var html = "";
	if (machineType == "Lathe") {
		html = '<form id="workpieceDimensions">' +
			'<ul>' +
			'  <li>' +
			'    <label for= "x" >Diameter</label>' +
			'    <input type= "text" name= "x" value="' + workpiece.x + '"/>' +
			'  </li>' +
			'   <li>' +
			'    <label for= "z" >Lenght</label>' +
			'    <input type= "text" name= "z" value="' + workpiece.z + '"/>' +
			'  </li>' +
			'</ul></form>';
	}
	else if (machineType == "Mill") {
		html = '<form id="workpieceDimensions">' +
			'<ul>' +
			'  <li>' +
			'    <label for= "x" >Size X</label>' +
			'    <input type= "text" name= "x" value="' + workpiece.x + '"/>' +
			'  </li>' +
			'  <li>' +
			'    <label for= "y" >Size Y</label>' +
			'    <input type= "text" name= "y" value="' + workpiece.y + '"/>' +
			'  </li>' +
			'   <li>' +
			'    <label for= "z" >Size Z</label>' +
			'    <input type= "text" name= "z" value="' + workpiece.z + '"/>' +
			'  </li>' +
			'</ul></form>';
	}

	this.dialog.append($(html));
	this.dialog.dialog(
		{
			width: 400,
			buttons:
			{
				"Save": function () {
					var values = {};
					var result = $(this.firstChild).serializeArray();
					for (var i = 0; i < result.length; i++) {
						values[result[i].name] = parseFloat(result[i].value);
					}
					controller.setWorkpieceDimensions(values);
					$(this).dialog("close");
				},
				"Cancel": function () {
					$(this).dialog("close");
				}
			}
		});
};

CWS.DialogBox.prototype.tool = function (controller) {
	var machineType = controller.getMachineType();
	if (machineType === "Lathe") {
		var machine = controller.getMachine();
		var html = '<form id="menuTool">' +
			'<ul>' +
			'  <li>' +
			'    <label for= "toolradius" >Tool radius</label>' +
			'    <input type= "text" name= "toolradius" value="' + machine.tool.radius + '"/>' +
			'  </li>' +
			'</ul>' +
			'</form>';
		this.dialog.append($(html));
		this.dialog.dialog(
			{
				width: 400,
				buttons:
				{
					"Save": function () {
						var values = {};
						var result = $(this.firstChild).serializeArray();
						for (var i = 0; i < result.length; i++) {
							values[result[i].name] = parseFloat(result[i].value);
						}
						controller.setMachineTool(values);
						$(this).dialog("close");
					},
					"Cancel": function () {
						$(this).dialog("close");
					}
				}
			});
	}
	else if (machineType === "Mill") {
		var machine = controller.getMachine();
		var html = '<form id="menuTool">' +
			'<ul>' +
			'  <li>' +
			'    <label for= "toolradius" >Tool radius</label>' +
			'    <input type= "text" name= "toolradius" value="' + machine.tool.radius + '"/>' +
			'  </li>' +
			'  <li>' +
			'    <label for= "toolangle" >Tool angle</label>' +
			'    <input type= "text" name= "toolangle" value="' + machine.tool.angle + '"/>' +
			'  </li>' +
			'</ul>' +
			'</form>';
		this.dialog.append($(html));
		this.dialog.dialog(
			{
				width: 400,
				buttons:
				{
					"Save": function () {
						var values = {};
						var result = $(this.firstChild).serializeArray();
						for (var i = 0; i < result.length; i++) {
							values[result[i].name] = parseFloat(result[i].value);
						}
						controller.setMachineTool(values);
						$(this).dialog("close");
					},
					"Cancel": function () {
						$(this).dialog("close");
					}
				}
			});
	}
	else {
		var html = '<ul><li>' + machineType + ' does not support tool settings</li></ul>';
		this.dialog.append($(html));
		this.dialog.dialog(
			{
				width: 400,
				buttons:
				{
					"Ok": function () {
						$(this).dialog("close");
					},
					"Cancel": function () {
						$(this).dialog("close");
					}
				}
			});
	}
};

CWS.DialogBox.prototype.materialSettings = function (controller) {
	if (!controller || !controller.material3D) {
		console.error("Controller or material3D is missing during dialog open!");
		alert("Error: Material system not ready.");
		return;
	}

	try {
		var mat = controller.material3D;
		var colorHex = '#' + mat.color.getHexString();

		var content =
			'<div style="padding: 10px;">' +
			'<label>Color (Hex): <input type="color" id="matColor" value="' + colorHex + '" style="width:100%; height:40px;"></label>' +
			'<label>Metalness: <span id="valMetal">' + mat.metalness + '</span><br>' +
			'<input type="range" id="matMetal" min="0" max="1" step="0.1" value="' + mat.metalness + '" style="width:100%">' +
			'</label>' +
			'<label>Roughness: <span id="valRough">' + mat.roughness + '</span><br>' +
			'<input type="range" id="matRough" min="0" max="1" step="0.1" value="' + mat.roughness + '" style="width:100%">' +
			'</label>' +
			'</div>';

		$('#dialogBox').html(content);

		// Live Updates
		$('#matColor').off('input').on('input', function () {
			var val = this.value.replace('#', '0x');
			controller.material3D.color.setHex(val);
		});

		$('#matMetal').off('input').on('input', function () {
			var val = parseFloat(this.value);
			controller.material3D.metalness = val;
			$('#valMetal').text(val);
		});

		$('#matRough').off('input').on('input', function () {
			var val = parseFloat(this.value);
			controller.material3D.roughness = val;
			$('#valRough').text(val);
		});

		$('#dialogBox').dialog({
			modal: false,
			title: "Material Configuration",
			height: "auto",
			width: 300,
			position: { my: "right top", at: "right-20 top+60", of: window }
		});
	} catch (e) {
		console.error("Error opening Material Dialog:", e);
		alert("Error opening dialog: " + e.message);
	}
};
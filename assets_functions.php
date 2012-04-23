<?php

/**
 * Permette di utilizzare la app "minify" per minificare i file js e css.
 * Durante lo sviluppo (ambiente "dev") saranno collegati alla pagina i file
 * originali, non concatenati e non minificati. In produzione invece (ambiente
 * "prod") saranno collegati alla pagina solo "script.js" e "style.css", che
 * saranno le versioni concatenate e minificate di tutti i file definiti nei
 * gruppi "js" e "css" di groupsConfig.php. E' possibile anche passare alle
 * funzioni un numero di versione che verrà inserito all'interno dei nomi dei
 * file, in modo da poter applicare tecniche di cache-bursting.
 */


/**
 * Restituisce l'array dei gruppi definiti nel file "groupsConfig.php" di minify
 * @return array
 */
function get_assets() {
  static $cache;
  if (!isset($cache))
    $cache = (require "$_SERVER[DOCUMENT_ROOT]/assets.php");
	return $cache;
}

/**
 * Scrive tutti i tag <script> necessari a collegare i file javascript. Se
 * l'ambiente di sviluppo corrente è "prod", allora verrà collegato solo
 * "script.js" (che tramite .htaccess dovrà reindirizzare a "/min/g=js").
 * Altrimenti saranno collegati tutti i javascript definiti nel gruppo "js" in
 * groupsConfig.php.
 */
function include_javascripts() {
  $assets = get_assets();
  $version = @$assets['js_version'];
  if (!isset($version)) $version = 0;
	if ($assets['minify']) {
		echo "<script src=\"/js/script.$version.js\"></script>";
	} else {
		foreach ($assets['js'] as $script)
			echo "<script src=\"/js/$script.$version.js\"></script>";
	}
}

/**
 * Scrive tutti i tag <link> necessari a collegare i file css. Se
 * l'ambiente di sviluppo corrente è "prod", allora verrà collegato solo
 * "style.js" (che tramite .htaccess dovrà reindirizzare a "/min/g=css").
 * Altrimenti saranno collegati tutti i css definiti nel gruppo "css" in
 * groupsConfig.php.
 */
function include_stylesheets() {
  $assets = get_assets();
  $version = @$assets['css_version'];
  if (!isset($version)) $version = 0;
	if ($assets['minify']) {
		echo "<link rel=\"stylesheet\" href=\"/css/style.$version.css\">";
	} else {
		foreach ($assets['css'] as $style)
			echo "<link rel=\"stylesheet\" href=\"/css/$style.$version.css\">";
	}
}
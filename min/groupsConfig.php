<?php
/**
 * Groups configuration for default Minify implementation
 * @package Minify
 */

$assets = (require_once("$_SERVER[DOCUMENT_ROOT]/assets.php"));
$min_assets = array('js' => array(), 'css' => array());
foreach ($min_assets as $group => &$files)
  foreach ($assets[$group] as $file) $files[] = "//$group/$file.$group";

return $min_assets;
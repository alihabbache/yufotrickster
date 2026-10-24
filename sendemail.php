<?php
# request sent using HTTP_X_REQUESTED_WITH
if( isset( $_SERVER['HTTP_X_REQUESTED_WITH'] ) AND ($_POST['url']=='')){                                  
	if (isset($_POST['name']) AND isset($_POST['email']) AND isset($_POST['message'])) {
		$to = 'yufotrickster@gmail.com';  // Change it by your email address
    $subject='Client Message - Website';
		$name = filter_var($_POST['name'], FILTER_SANITIZE_STRING);
		$email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
		$message = filter_var($_POST['message'], FILTER_SANITIZE_STRING);
   
		$sent = email($to, $email, $name, $subject, $message);
		if ($sent) {
			echo "<div class='content-message'> <i class='fa fa-rocket fa-3x'></i> <h2>Email Sent Successfully</h2> <p>Your message has been submitted.</p> </div>";
		} else {
			echo "<div class='content-message'> <i class='fa fa-times fa-3x'></i> <h2>Error sending</h2> <p>Try again later.</p> </div>";
		}
	}
	else {
		echo 'All Fields are required';
	}
	return;
}

/**
 * email function
 *
 * @return bool | void
 **/
function email($to, $from_mail, $from_name, $subject, $message){
	$headers  = "From: $from_mail\r\n";
	$headers .= "Reply-To: $from_mail\r\n";
	$headers .= "MIME-Version: 1.0\r\n";
	$headers .= "Content-Type: text/html; charset=UTF-8\r\n";

	return mail($to, $subject, $message, $headers);
}
?>
import random
import hashlib
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string


def generate_otp():
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))


def hash_otp(otp):
    """Hash OTP using SHA256"""
    return hashlib.sha256(otp.encode()).hexdigest()


def send_otp_email(user, otp, purpose='registration'):
    """
    Send OTP email to user
    
    Args:
        user: User instance
        otp: Generated OTP
        purpose: 'registration' or 'reset_password'
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        if purpose == 'registration':
            subject = '🔐 Verify Your Email - Tourist Alert System'
            message = f"""
Hi {user.fullName},

Welcome to Tourist Alert System!

Your email verification code is: {otp}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
Tourist Alert System Team
"""
        elif purpose == 'reset_password':
            subject = '🔒 Password Reset OTP - Tourist Alert System'
            message = f"""
Hi {user.fullName},

You requested to reset your password.

Your password reset code is: {otp}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email and your password will remain unchanged.

Best regards,
Tourist Alert System Team
"""
        else:
            return False
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return True
        
    except Exception as e:
        print(f"Error sending OTP email to {user.email}: {str(e)}")
        return False


def send_welcome_email(user):
    """
    Send welcome email to newly registered user
    
    Args:
        user: User instance
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        if user.role == 'TOURIST':
            subject = '🌟 Welcome to Tourist Alert System!'
            message = f"""
Hi {user.fullName},

Welcome to Tourist Alert System - Your Gateway to Safe and Memorable Tourism!

🎉 Your tourist account has been created successfully!

📱 What You Can Do Now:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Browse verified local guides
✓ Book tours and activities
✓ Get real-time alerts about tourist spots
✓ Access safety information
✓ Read reviews from other travelers
✓ Plan your perfect Nepal adventure

🔐 Your Account:
Email: {user.email}
Role: Tourist
Status: Active

Start exploring Nepal with confidence!

Best regards,
Tourist Alert System Team
"""
        else:  # GUIDE
            subject = '📋 Guide Registration Received - Tourist Alert System'
            message = f"""
Hi {user.fullName},

Thank you for registering as a guide with Tourist Alert System!

✅ Your application has been received and is under review by our admin team.

📋 Application Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
License Number: {user.guideProfile.licenseNumber}
Issued By: {user.guideProfile.licenseIssuedBy}
Status: PENDING VERIFICATION ⏳
Submitted: {user.createdAt.strftime('%B %d, %Y at %I:%M %p')}

⏱️ What Happens Next?
Our admin team will review your application within 1-2 business days.

📧 You Will Receive:
An email notification once your account is verified.

Thank you for your patience!

Best regards,
Tourist Alert System Team
"""
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return True
        
    except Exception as e:
        print(f"Error sending welcome email to {user.email}: {str(e)}")
        return False
    
def send_guide_verification_approved_email(user):
    """
    Send email to guide when admin approves/verifies their profile.
    
    Args:
        user: User instance (must have .guideProfile)
    
    Returns:
        bool: True if sent successfully
    """
    try:
        guide_profile = user.guideProfile
        
        subject = '✅ Your Guide Account Has Been Verified! - Tourist Alert System'
        
        message = f"""
Hi {user.fullName},

Great news! 🎉

Your guide account has been **successfully verified** by our admin team.

You can now:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Accept tour bookings
✓ Create and publish tour packages
✓ Appear in guide search results
✓ Receive inquiries from tourists

Your profile is now live and visible to all users.

Profile Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
License Number: {guide_profile.licenseNumber}
Issued By:      {guide_profile.licenseIssuedBy}
Verified On:    {guide_profile.updatedAt.strftime('%B %d, %Y at %I:%M %p')}

Thank you for joining us in making tourism in Nepal safer and more enjoyable!

If you have any questions, feel free to reply to this email.

Best regards,
Tourist Alert System Team
"""
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return True
        
    except Exception as e:
        print(f"Error sending guide verification email to {user.email}: {str(e)}")
        return False
    
def send_guide_verification_rejected_email(user, reason=""):
    """
    Send email to guide when admin rejects their profile verification.
    
    Args:
        user: User instance (must have .guideProfile)
        reason: Optional rejection reason from admin
    
    Returns:
        bool: True if sent successfully
    """
    try:
        
        subject = '⚠️ Update on Your Guide Application - Tourist Alert System'
        
        reason_text = reason.strip() if reason and reason.strip() else "No specific reason provided. Please review your submitted information and re-apply if needed."
        
        message = f"""
Hi {user.fullName},

Thank you for your interest in becoming a verified guide with Tourist Alert System.

After careful review, we regret to inform you that your guide application has **not been approved** at this time.

Rejection Reason:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{reason_text}

What You Can Do Next:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Review and update your profile information
• Correct any issues with license documents or details
• Re-submit your application for another review

You can make changes to your profile at any time and it will be reviewed again.

If you believe this decision was made in error or need clarification, please reply directly to this email.

We appreciate your understanding and look forward to potentially working with you in the future.

Best regards,
Tourist Alert System Team
"""
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return True
        
    except Exception as e:
        print(f"Error sending guide rejection email to {user.email}: {str(e)}")
        return False
# Generated by Django 5.0.4 on 2024-05-11 22:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0011_user_pfp'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='pfp',
            field=models.ImageField(default='settings.MEDIA_ROOT/pfps/Default_pfp.jpg', upload_to='pfps'),
        ),
    ]
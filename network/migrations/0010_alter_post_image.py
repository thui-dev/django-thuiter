# Generated by Django 5.0.4 on 2024-05-10 23:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0009_post_image'),
    ]

    operations = [
        migrations.AlterField(
            model_name='post',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='posts'),
        ),
    ]

from PIL import Image
import os

TARGET_W = 350
TARGET_H = 464


def transpose(im: Image.Image) -> Image.Image:
    out = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return out


def cut(im: Image.Image) -> None:
    width, height = im.size
    if width / height < TARGET_W / TARGET_H * 4 / 3:
        if width / height < TARGET_W / TARGET_H:
            new_height = width * TARGET_H / TARGET_W
            top = (height - new_height) / 2
            bottom = top + new_height
            im_crop = im.crop((0, top, width, bottom))
        else:
            new_width = height * TARGET_W / TARGET_H
            left = (width - new_width) / 2
            right = left + new_width
            im_crop = im.crop((left, 0, right, height))
        save(im_crop, "cut.jpg")
    else:
        num = int(width / height // (TARGET_W / TARGET_H / 3) - 3)
        for i in range(-num, num + 1):
            new_width = height * TARGET_W / TARGET_H
            left = (width - new_width) / 2 + i * new_width / 6
            right = left + new_width
            im_crop = im.crop((left, 0, right, height))
            save(im_crop, f"{num + i}.jpg")


def save(im: Image.Image, outfile: str) -> None:
    im_resized = im.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS)
    im_resized.save(outfile, quality=100, subsampling=0)


def main(infile):
    with Image.open(infile) as im:
        im = im.convert("RGB")
        print(infile, im.format, f"{im.size}x{im.mode}")
        # im = transpose(im)
        cut(im)


if __name__ == "__main__":
    main("箭厉沙场.png")

# Discord FAQ

## What is this?
This is my personal discord server, and a mirror of `-c emilycf` on zephyr. I'm
using it as a general platform to talk about my life.

## Why are there so many channels?
I'm primarily using this as a mirror of my personal zephyr class, `-c emilycf`.
The script I'm using to bridge Discord and zephyr ([Zygarde][0]) maps zephyr
instances to Discord channels. In order to make things mirror nicely (instances
that don't correspond to channels just go to the #general channel), I made a
bunch of channels for instances I expect to be using.

## What's zephyr?
Zephyr is an MIT-based (technically it's also used a bit at CMU and maybe one
or two other schools, but I think the largest undergrad usage is at MIT)
messaging platform that predates IRC and basically every other internet
messaging platform. Because of the way it's set up, after you graduate you lose
access (unless you're active in one of the clubs that sponsor people's
accounts).

Zephyr is organized into "classes" and "instances". A class is something like a
chat room in other messaging platforms. Most conversation on zephyr takes place
on "personal classes", which are named after a person's username, and are
treated as that user's space to start conversations/rant into the void about
whatever they want to talk about. An instance is basically a topic, and can be
basically anything -- there's no limit on the number of instances that can
exist, and they are created simply by sending a message to them.

The most commonly-used zephyr interface, Barnowl, displays all messages in a
single view, although it is very easy to filter by class or instance. This
format encourages the use of a lot of distinct instances, so that one can
easily filter to a single conversation, but easily catch up on a large number
of messages at once (by scrolling thru the unfiltered view).

## Why am I using Discord?
A couple of MIT folks who had been pretty active zephyr users (@sadun and
@ltchin) started an experiment by moving to Discord, since their zephyr access
would be going away at some point. At first, I decided to stay on zephyr,
because I liked the interface a lot better, and I didn't want to be a part of
network effects encouraging more people to move away from zephyr. But then,
@cesium made [Zygarde][0] (which @dannybd and others subsequently contributed
to), which allowed bridging between Discord and zephyr.  Now that I could
continue using zephyr as my primary point of interaction, I decided to jump on
the bandwagon, so that people would join my server now, while they were still
in the "join ALL the servers" phase.

## What are all these things in brackets (and abbreviations)?
The brackets one might see at the beginning of a message are artifacts of the
bridge between zephyr and Discord, to translate some zephyr idioms that don't
quite work on Discord.

\[un\]: This corresponds to the zephyr concept of an "unclass", which is a
class whose name is the name of the original class, prefixed with "un". This is
used primarily for snarking about the conversation on the main class. \[unun\]
also exists, for even snarkier or more ridiculous comments, or snarks about
comments on the unclass.

\[-i <...>\]: This is inserted by Zygarde when the instance used on zephyr
isn't the same as the channel name (`-i` being the abbreviation for instance).
This generally happens in two places. The first is when there is a period in
the instance name, the message is sent to the Discord channel corresponding to
the part of the instance up to the first period (since Discord doesn't allow
periods in channel names). The second is when there simply isn't a channel
corresponding to the instance, in which case the message is sent to the
#general channel.

\[-i foo.d\]: If ".d" is added to the end of an instance name, it generally
refers to a tangent from the original discussion. One might also see `-i
foo.d.d` for a tangent on the tangent, or `-i foo.d2` for a second tangent
unrelated to that being discussed on `-i foo.d`.

\[-i foo.q\]: A ".q" at the end of an instance generally refers to a quote
by/from the entity referred to by the instance. (So `-i et.q` would refer to a
quote heard at et).

\[stark\]: This is a zephyr convention, used when coming back to a conversation
significantly later, after the conversation has either moved on or stopped.
Named after Greg Stark, a zephyr user from before my time, who had a habit of
responding hours or days later without checking whether anyone else had
responded or if the topic had completely moved on.

_ψrnf_ (also _prnf_): "Pseudo-random neuron firing". General random thoughts,
should not generally be taken seriously.

_eiz_: "Elsewhere in zephyr". Refers to conversations happening on other zephyr
classes, either because I don't want to get involved there, or because I have
sufficiently many thoughts that I want to expand on them here.

_eim_: "Elsewhere in meatspace". Comments on the physical world around me.

_eiw_: "Elsewhere in webspace". Comments on things on the internet.

_doxp_: "Do X predicate" (alternatively "Do X or punt"), originally from Lisp.
A discussion on whether I should do X. "#t" and "#f" for "true" and "false" are
commonly seen responses, also common are "x" and "p" for "do x" and "punt (i.e.
don't do x), respectively.

_doxory_, _doxyz_, etc.: "Do X or Y", "Do X or Y or Z", etc.

_i,i_: "I have no point here, I just like saying:". Basically, "I care enough
about this to say this, but not enough to argue further." Somewhat snarky, can
usually be ignored. Used similarly (altho not identically) to scare quotes.

_punt_, _tool_: MIT slang – to tool is to work on things you need to do
(typically schoolwork); to punt is to put off doing those things.

## Why do some people show up as bots?
They're probably posting on zephyr, and the Zygarde bot is mirroring their
messages on discord.

[0]: https://github.com/cesium12/zygarde/

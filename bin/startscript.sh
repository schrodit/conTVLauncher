#!/bin/bash
INSTANZ="Beispiel-Programm"
APPCMD=$3
Pidfile=$2

if [ -f $Pidfile ]
then
	Pid=`cat $Pidfile`
fi

case "$1" in
'start')
		if [ -f $Pidfile ] ; then
				if test `ps -e | grep -c $Pid` = 1; then
						echo "Not starting $INSTANZ - instance already running with PID: $Pid"
				else
						echo "Starting $INSTANZ"
						$APPCMD &> /dev/null &
						echo $! > $Pidfile
				fi
		else
				echo "Starting $INSTANZ"
				$APPCMD &> /dev/null &
				echo $! > $Pidfile
		fi
		;;

'stop')
		if [ -f $Pidfile ] ; then
				echo "stopping $INSTANZ"
				kill -15 $Pid
		else
				echo "Cannot stop $INSTANZ - no Pidfile found!"
		fi
		;;

'restart')
		$0 stop
		sleep 5
		$0 start
		;;

'status')
		if [ -f $Pidfile ] ; then
				if test `ps -e | grep -c $Pid` = 0; then
						echo "$INSTANZ not running"
				else
						echo "$INSTANZ running with PID: [$Pid]"
				fi
		else
				echo "$Pidfile does not exist! Cannot process $INSTANZ status!"
				exit 1
		fi
		;;

*)
		echo "usage: $0 { start | stop | restart | status }"
		;;

esac
exit 0
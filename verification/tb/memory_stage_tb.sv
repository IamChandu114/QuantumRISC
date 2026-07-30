`timescale 1ns / 1ps

module memory_stage_tb;

logic clk;

logic MemRead;
logic MemWrite;

logic [31:0] address;
logic [31:0] write_data;

logic [31:0] read_data;

memory_stage DUT(

    .clk(clk),
    .MemRead(MemRead),
    .MemWrite(MemWrite),
    .address(address),
    .write_data(write_data),
    .read_data(read_data)

);

always #5 clk = ~clk;

initial begin

    clk = 0;

    $display("------------------------------");
    $display("Memory Stage Test");
    $display("------------------------------");

    address = 32'd4;
    write_data = 32'd1234;

    MemWrite = 1;
    MemRead  = 0;

    #10;

    MemWrite = 0;
    MemRead  = 1;

    #10;

    if(read_data == 32'd1234)
        $display("[PASS] Memory Read/Write");
    else
        $display("[FAIL] Memory Read/Write");

    $display("------------------------------");

    $finish;

end

endmodule



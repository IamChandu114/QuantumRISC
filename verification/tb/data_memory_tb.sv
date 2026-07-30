`timescale 1ns / 1ps

module data_memory_tb;

logic clk;
logic MemRead;
logic MemWrite;
logic [31:0] address;
logic [31:0] write_data;
logic [31:0] read_data;

data_memory dut(
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
    MemRead = 0;
    MemWrite = 0;
    address = 0;
    write_data = 0;

    $display("------------------------------");
    $display("Data Memory Test");
    $display("------------------------------");

    // Write
    address = 32'd4;
    write_data = 32'd1234;
    MemWrite = 1;

    #10;

    MemWrite = 0;

    // Read
    MemRead = 1;

    #10;

    if(read_data == 32'd1234)
        $display("[PASS] Read/Write Test");
    else
        $display("[FAIL] Read/Write Test");

    $display("------------------------------");

    $finish;

end

endmodule
